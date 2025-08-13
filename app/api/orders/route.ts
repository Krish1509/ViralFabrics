import dbConnect from "@/lib/dbConnect";
import Order, { IOrderModel } from "@/models/Order";
import Party from "@/models/Party";
import { requireAuth } from "@/lib/session";
import { type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Remove authentication requirement for now
    // await requireAuth(req);

    await dbConnect();
    
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
    
         // Execute query with pagination and population
     const [orders, totalCount] = await Promise.all([
       Order.find(query)
         .populate('party', '_id name contactName contactPhone address')
         .populate('items.quality', '_id name description')
         .sort(sortObject)
         .limit(limit)
         .select('_id orderId orderNo orderType arrivalDate party contactName contactPhone poNumber styleNo poDate deliveryDate items createdAt updatedAt'),
       Order.countDocuments(query)
     ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    // Get cursor for next page
    const nextCursor = orders.length > 0 ? orders[orders.length - 1][sortBy] : null;

    return new Response(JSON.stringify({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage,
          nextCursor,
          sortBy,
          sortOrder
        }
      }
    }), { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
      }
    }
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ message }), { status: 500 });
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
    
    if (!orderType || !['Dying', 'Printing'].includes(orderType)) {
      errors.push("Order type is required and must be either 'Dying' or 'Printing'");
    }
    
    if (!arrivalDate) {
      errors.push("Arrival date is required");
    } else {
      const arrival = new Date(arrivalDate);
      if (isNaN(arrival.getTime())) {
        errors.push("Invalid arrival date format");
      }
    }
    
    if (!party) {
      errors.push("Party is required");
    } else if (!party.match(/^[0-9a-fA-F]{24}$/)) {
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
    
    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      errors.push("At least one order item is required");
    } else {
      items.forEach((item, index) => {
        if (item.quality && !item.quality.match(/^[0-9a-fA-F]{24}$/)) {
          errors.push(`Invalid quality ID format in item ${index + 1}`);
        }
        if (item.quantity !== undefined && item.quantity !== null) {
          if (typeof item.quantity !== 'number' || item.quantity < 0) {
            errors.push(`Quantity must be a non-negative number in item ${index + 1}`);
          }
        }
        if (item.imageUrl && item.imageUrl.trim().length > 500) {
          errors.push(`Image URL cannot exceed 500 characters in item ${index + 1}`);
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

    await dbConnect();

    // Verify party exists
    const partyExists = await Party.findById(party);
    if (!partyExists) {
      return new Response(
        JSON.stringify({ message: "Party not found" }), 
        { status: 400 }
      );
    }

    // Verify qualities exist if provided
    if (items && items.length > 0) {
      const Quality = (await import('@/models/Quality')).default;
      for (const item of items) {
        if (item.quality) {
          const qualityExists = await Quality.findById(item.quality);
          if (!qualityExists) {
            return new Response(
              JSON.stringify({ message: `Quality not found for item` }), 
              { status: 400 }
            );
          }
        }
      }
    }

    // Check for duplicate PO + Style combination for the same party
    if (poNumber && styleNo) {
      const existingOrder = await Order.findOne({
        party,
        poNumber: poNumber.trim(),
        styleNo: styleNo.trim()
      });
      
      if (existingOrder) {
        return new Response(
          JSON.stringify({ 
            message: "An order with this PO number and style number already exists for this party" 
          }), 
          { status: 400 }
        );
      }
    }

    // Create order data object
    const orderData = {
      orderType,
      arrivalDate: new Date(arrivalDate),
      party,
      contactName: contactName ? contactName.trim() : undefined,
      contactPhone: contactPhone ? contactPhone.trim() : undefined,
      poNumber: poNumber ? poNumber.trim() : undefined,
      styleNo: styleNo ? styleNo.trim() : undefined,
      poDate: poDate ? new Date(poDate) : undefined,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
      items: items.map((item: any) => ({
        quality: item.quality || undefined,
        quantity: item.quantity !== undefined && item.quantity !== null ? item.quantity : undefined,
        imageUrl: item.imageUrl ? item.imageUrl.trim() : undefined,
        description: item.description ? item.description.trim() : undefined,
      })),
    };
    
    // Generate order ID manually
    const count = await Order.countDocuments();
    const nextNumber = count + 1;
    const orderId = `ORD-${nextNumber.toString().padStart(2, '0')}`; // ORD-01, ORD-02, etc.
    
    console.log(`Creating order with ID: ${orderId}`); // Debug log
    
    // Create the order with the generated ID
    const createdOrder = await Order.create({
      ...orderData,
      orderId,
      orderNo: orderId
    });

    // Populate party and quality data and return
    const populatedOrder = await Order.findById(createdOrder._id)
      .populate('party', '_id name contactName contactPhone address')
      .populate('items.quality', '_id name description')
      .select('_id orderId orderType arrivalDate party contactName contactPhone poNumber styleNo poDate deliveryDate items createdAt updatedAt');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Order created successfully", 
        data: populatedOrder 
      }), 
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
      }
      
      // Handle MongoDB duplicate key errors
      if (error.message.includes('E11000')) {
        if (error.message.includes('party') && error.message.includes('poNumber') && error.message.includes('styleNo')) {
          return new Response(
            JSON.stringify({ 
              message: "An order with this PO number and style number already exists for this party" 
            }), 
            { status: 400 }
          );
        }
        if (error.message.includes('orderId')) {
          return new Response(
            JSON.stringify({ message: "Order ID generation failed, please try again" }), 
            { status: 500 }
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
