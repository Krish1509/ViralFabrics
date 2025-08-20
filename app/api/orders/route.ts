import dbConnect from "@/lib/dbConnect";
import Order, { IOrderModel, IOrder } from "@/models/Order";
import Party from "@/models/Party";
import Quality from "@/models/Quality";
import Counter from "@/models/Counter";
import { requireAuth } from "@/lib/session";
import { type NextRequest } from "next/server";
import { logView, logCreate, logError } from "@/lib/logger";

// Ensure all models are registered
const models = { Order, Party, Quality, Counter };

export async function GET(req: NextRequest) {
  try {
    // Remove authentication requirement for now
    // await requireAuth(req);

    // Improved database connection with retry logic
    let connectionAttempts = 0;
    const maxAttempts = 3;
    let dbConnection = null;

    while (connectionAttempts < maxAttempts) {
      try {
        dbConnection = await dbConnect();
        break;
      } catch (dbError) {
        connectionAttempts++;
        console.error(`Database connection attempt ${connectionAttempts} failed:`, dbError);
        
        if (connectionAttempts >= maxAttempts) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: "Database connection failed after multiple attempts" 
            }), 
            { status: 503 }
          );
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * connectionAttempts));
      }
    }
    
    const { searchParams } = new URL(req.url);
    
    // Extract query parameters
    const party = searchParams.get('party');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const styleNo = searchParams.get('styleNo');
    const poNumber = searchParams.get('poNumber');
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Max 100 per page
    const skip = (page - 1) * limit;
    
    // Cursor-based pagination parameters
    const cursor = searchParams.get('cursor'); // _id of the last document
    const sortBy = searchParams.get('sortBy') || 'createdAt'; // createdAt or _id
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // asc or desc

    // Build query object
    const query: any = {};
    
    if (party) {
      // Validate party ID format
      if (!party.match(/^[0-9a-fA-F]{24}$/)) {
        return new Response(
          JSON.stringify({ message: "Invalid party ID format" }), 
          { status: 400 }
        );
      }
      query.party = party;
    }
    
    if (startDate || endDate) {
      query.arrivalDate = {};
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          return new Response(
            JSON.stringify({ message: "Invalid start date format" }), 
            { status: 400 }
          );
        }
        query.arrivalDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return new Response(
            JSON.stringify({ message: "Invalid end date format" }), 
            { status: 400 }
          );
        }
        query.arrivalDate.$lte = end;
      }
    }
    
    if (styleNo && styleNo.trim()) {
      query.styleNo = { $regex: styleNo.trim(), $options: 'i' };
    }
    
    if (poNumber && poNumber.trim()) {
      query.poNumber = { $regex: poNumber.trim(), $options: 'i' };
    }

    // Build sort object
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortObject: { [key: string]: 1 | -1 } = { [sortBy]: sortDirection };
    
    // Build cursor query if cursor is provided
    if (cursor) {
      const cursorOperator = sortOrder === 'asc' ? '$gt' : '$lt';
      query[sortBy] = { [cursorOperator]: cursor };
    }
    
    // Execute query with pagination and population with timeout
    const queryPromise = Promise.all([
      Order.find(query)
        .populate('party', '_id name contactName contactPhone address')
        .populate('items.quality', '_id name description')
        .sort(sortObject)
        .limit(limit)
        .select('_id orderId orderType arrivalDate party contactName contactPhone poNumber styleNo poDate deliveryDate items status labData createdAt updatedAt')
        .maxTimeMS(10000), // 10 second timeout
      Order.countDocuments(query).maxTimeMS(5000) // 5 second timeout
    ]);

    const [orders, totalCount] = await Promise.race([
      queryPromise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 15000)
      )
    ]) as [any[], number];

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    // Get cursor for next page
    let nextCursor = null;
    if (hasNextPage && orders.length > 0) {
      const lastOrder = orders[orders.length - 1];
      nextCursor = lastOrder[sortBy];
    }

    return new Response(JSON.stringify({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextCursor
      }
    }), { status: 200 });
  } catch (error: unknown) {
    console.error('Orders GET error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: "Unauthorized" 
        }), { status: 401 });
      }
      
      if (error.message.includes("Database connection failed")) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: "Database connection failed. Please try again." 
        }), { status: 503 });
      }
      
      if (error.message.includes("Database query timeout")) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: "Request timeout. Please try again." 
        }), { status: 408 });
      }
    }
    
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ 
      success: false,
      message 
    }), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Remove authentication requirement for now
    // await requireAuth(req);

    const {
      orderType,
      arrivalDate,
      party,
      contactName,
      contactPhone,
      poNumber,
      styleNo,
      poDate,
      deliveryDate,
      items
    } = await req.json();

    // Validation
    const errors: string[] = [];
    
    // Optional fields validation (only validate if provided)
    if (orderType && !['Dying', 'Printing'].includes(orderType)) {
      errors.push("Order type must be either 'Dying' or 'Printing' if provided");
    }
    
    if (arrivalDate) {
      const arrival = new Date(arrivalDate);
      if (isNaN(arrival.getTime())) {
        errors.push("Invalid arrival date format");
      }
    }
    
    if (party && !party.match(/^[0-9a-fA-F]{24}$/)) {
      errors.push("Invalid party ID format");
    }
    
    if (contactName && contactName.trim().length > 50) {
      errors.push("Contact name cannot exceed 50 characters");
    }
    
    if (contactPhone && contactPhone.trim().length > 20) {
      errors.push("Contact phone cannot exceed 20 characters");
    }
    
    if (poNumber && poNumber.trim().length > 50) {
      errors.push("PO number cannot exceed 50 characters");
    }
    
    if (styleNo && styleNo.trim().length > 50) {
      errors.push("Style number cannot exceed 50 characters");
    }
    
    if (poDate) {
      const po = new Date(poDate);
      if (isNaN(po.getTime())) {
        errors.push("Invalid PO date format");
      }
    }
    
    if (deliveryDate) {
      const delivery = new Date(deliveryDate);
      if (isNaN(delivery.getTime())) {
        errors.push("Invalid delivery date format");
      }
    }
    
    // Validate items (all fields are optional)
    if (items && Array.isArray(items)) {
      items.forEach((item, index) => {
        if (item.quality && !item.quality.match(/^[0-9a-fA-F]{24}$/)) {
          errors.push(`Invalid quality ID format in item ${index + 1}`);
        }
        if (item.quantity !== undefined && item.quantity !== null) {
          if (typeof item.quantity !== 'number' || item.quantity < 0) {
            errors.push(`Quantity must be a non-negative number in item ${index + 1}`);
          }
        }
        if (item.imageUrls && Array.isArray(item.imageUrls)) {
          item.imageUrls.forEach((url: string, urlIndex: number) => {
            if (url && url.trim().length > 500) {
              errors.push(`Image URL cannot exceed 500 characters in item ${index + 1}, image ${urlIndex + 1}`);
            }
          });
        }
        if (item.description && item.description.trim().length > 200) {
          errors.push(`Description cannot exceed 200 characters in item ${index + 1}`);
        }
      });
    }
    
    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ message: errors.join(", ") }), 
        { status: 400 }
      );
    }

    // Improved database connection with retry logic
    let connectionAttempts = 0;
    const maxAttempts = 3;
    let dbConnection = null;

    while (connectionAttempts < maxAttempts) {
      try {
        dbConnection = await dbConnect();
        break;
      } catch (dbError) {
        connectionAttempts++;
        console.error(`Database connection attempt ${connectionAttempts} failed:`, dbError);
        
        if (connectionAttempts >= maxAttempts) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: "Database connection failed after multiple attempts" 
            }), 
            { status: 503 }
          );
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * connectionAttempts));
      }
    }

    // Verify party exists only if provided
    if (party) {
      const partyExists = await Party.findById(party).maxTimeMS(5000);
      if (!partyExists) {
        return new Response(
          JSON.stringify({ message: "Party not found" }), 
          { status: 400 }
        );
      }
    }

    // Verify qualities exist if provided
    if (items && items.length > 0) {
      for (const item of items) {
        if (item.quality) {
          const qualityExists = await Quality.findById(item.quality).maxTimeMS(5000);
          if (!qualityExists) {
            return new Response(
              JSON.stringify({ message: `Quality not found for item` }), 
              { status: 400 }
            );
          }
        }
      }
    }

    // Removed duplicate PO + Style combination check - allowing multiple orders with same PO/Style

    // Create order data object with optional fields
    const orderData: any = {
      contactName: contactName ? contactName.trim() : undefined,
      contactPhone: contactPhone ? contactPhone.trim() : undefined,
      poNumber: poNumber ? poNumber.trim() : undefined,
      styleNo: styleNo ? styleNo.trim() : undefined,
      poDate: poDate ? new Date(poDate) : undefined,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
      items: items && items.length > 0 ? items.map((item: any) => ({
        quality: item.quality || undefined,
        quantity: item.quantity !== undefined && item.quantity !== null ? item.quantity : undefined,
        imageUrls: item.imageUrls && Array.isArray(item.imageUrls) ? item.imageUrls.map((url: string) => url.trim()) : [],
        description: item.description ? item.description.trim() : undefined,
      })) : [],
    };

    // Add optional fields only if they are provided
    if (orderType) {
      orderData.orderType = orderType;
    }
    if (arrivalDate) {
      orderData.arrivalDate = new Date(arrivalDate);
    }
    if (party) {
      orderData.party = party;
    }
    
    // Use the new sequential order creation method with timeout
    const orderPromise = (Order as IOrderModel).createOrder(orderData);
    const order = await Promise.race([
      orderPromise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Order creation timeout')), 15000)
      )
    ]) as IOrder & { _id: string };
    
    // Populate the order with party and quality details
    const populatedOrder = await Order.findById(order._id)
      .populate('party', '_id name contactName contactPhone address')
      .populate('items.quality', '_id name description')
      .select('_id orderId orderType arrivalDate party contactName contactPhone poNumber styleNo poDate deliveryDate items status labData createdAt updatedAt')
      .maxTimeMS(5000);

    // Log the order creation
    await logCreate('order', (order as any)._id.toString(), { 
      orderId: order.orderId,
      orderType: order.orderType,
      poNumber: order.poNumber,
      styleNo: order.styleNo,
      party: order.party
    }, req);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Order created successfully", 
        data: populatedOrder 
      }), 
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Orders POST error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
      }
      
      if (error.message.includes("Database connection failed")) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: "Database connection failed. Please try again." 
        }), { status: 503 });
      }
      
      if (error.message.includes("Order creation timeout")) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: "Order creation timeout. Please try again." 
        }), { status: 408 });
      }
      
      // Handle MongoDB duplicate key errors
      if (error.message.includes('E11000')) {
        if (error.message.includes('orderId')) {
          return new Response(
            JSON.stringify({ 
              message: "Order ID already exists. Please try again." 
            }), 
            { status: 400 }
          );
        }
      }
      
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values((error as any).errors).map((err: any) => err.message);
        return new Response(
          JSON.stringify({ message: validationErrors.join(", ") }), 
          { status: 400 }
        );
      }
    }
    
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ message }), { status: 500 });
  }
}
