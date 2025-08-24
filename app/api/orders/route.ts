import dbConnect from "@/lib/dbConnect";
import Order, { IOrderModel, IOrder } from "@/models/Order";
import Party from "@/models/Party";
import Quality from "@/models/Quality";
import Counter from "@/models/Counter";
import { requireAuth } from "@/lib/session";
import { type NextRequest } from "next/server";
import { logView, logOrderChange, logError } from "@/lib/logger";

// Ensure all models are registered
const models = { Order, Party, Quality, Counter };

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50'); // Default limit for faster loading
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    const orderType = searchParams.get('orderType') || '';
    const status = searchParams.get('status') || '';
    
    // Build query
    const query: any = {
      $or: [
        { softDeleted: false },
        { softDeleted: { $exists: false } }
      ]
    };
    
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { 'party.name': { $regex: search, $options: 'i' } },
        { contactName: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (orderType) {
      query.orderType = orderType;
    }
    
    if (status) {
      query.status = status;
    }
    
    // Optimized query with limits and proper indexing
    const orders = await Order.find(query)
      .populate('party', 'name contactName contactPhone address')
      .populate('items.quality', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean()
      .maxTimeMS(3000); // Further reduced to 3 second timeout for faster response

    // Fetch lab data for all orders and attach to items
    if (orders.length > 0) {
      const Lab = (await import('@/models/Lab')).default;
      const orderIds = orders.map(order => order._id);
      
      const labs = await Lab.find({ 
        order: { $in: orderIds },
        softDeleted: { $ne: true }
      })
      .select('orderItemId labSendDate labSendData status') // Only select needed fields
      .lean()
      .maxTimeMS(1500); // Further reduced timeout for faster response
      
      // Create a map of orderItemId to lab data
      const labMap = new Map();
      labs.forEach(lab => {
        labMap.set(lab.orderItemId.toString(), lab);
      });
      
      // Attach lab data to order items
      orders.forEach(order => {
        if (order.items) {
          order.items.forEach((item: any) => {
            const labData = labMap.get(item._id.toString());
            if (labData) {
              item.labData = {
                color: labData.labSendData?.color,
                shade: labData.labSendData?.shade,
                notes: labData.labSendData?.notes,
                labSendDate: labData.labSendDate,
                approvalDate: labData.labSendData?.approvalDate,
                sampleNumber: labData.labSendData?.sampleNumber,
                imageUrl: labData.labSendData?.imageUrl,
                status: labData.status
              };
            }
          });
        }
      });
    }
    
    const total = await Order.countDocuments(query).maxTimeMS(2000); // Further reduced timeout
    

    
    // Add cache headers - short cache for better performance while maintaining real-time updates
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'max-age=30, must-revalidate', // 30 second cache for better performance
      'Pragma': 'no-cache'
    };
    
    return new Response(JSON.stringify({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }), { headers });
    
  } catch (error) {
    console.error('Error fetching orders:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to fetch orders'
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
      weaverSupplierName,
      purchaseRate,
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
    
    if (party && party !== '' && !party.match(/^[0-9a-fA-F]{24}$/)) {
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
    
    if (weaverSupplierName && weaverSupplierName.trim().length > 100) {
      errors.push("Weaver supplier name cannot exceed 100 characters");
    }
    
    if (purchaseRate !== undefined && purchaseRate !== null && purchaseRate !== '') {
      const rate = parseFloat(purchaseRate);
      if (isNaN(rate) || rate < 0) {
        errors.push("Purchase rate must be a non-negative number");
      }
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
    
    // Validate items - quality is optional, quantity is required
    if (items && Array.isArray(items)) {
      items.forEach((item, index) => {
        // Quality is optional for each item
        if (item.quality && item.quality !== '' && !item.quality.match(/^[0-9a-fA-F]{24}$/)) {
          errors.push(`Invalid quality ID format in item ${index + 1}`);
        }
        
        // Quantity is required for each item
        if (item.quantity === undefined || item.quantity === null) {
          errors.push(`Quantity is required for item ${index + 1}`);
        } else if (typeof item.quantity !== 'number' || item.quantity <= 0) {
          errors.push(`Quantity must be a positive number in item ${index + 1}`);
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
    if (party && party !== '' && party !== 'null' && party !== 'undefined') {
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
        if (item.quality && item.quality !== '' && item.quality !== 'null' && item.quality !== 'undefined') {
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
      weaverSupplierName: weaverSupplierName ? weaverSupplierName.trim() : undefined,
      purchaseRate: purchaseRate !== undefined && purchaseRate !== null && purchaseRate !== '' ? 
        (() => {
          const rate = parseFloat(purchaseRate);
          return isNaN(rate) ? undefined : rate;
        })() : undefined,
      items: items && items.length > 0 ? items.map((item: any) => ({
        quality: item.quality && item.quality !== '' && item.quality !== 'null' && item.quality !== 'undefined' ? item.quality : undefined,
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
    if (party && party !== '' && party !== 'null' && party !== 'undefined') {
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
      .select('_id orderId orderType arrivalDate party contactName contactPhone poNumber styleNo weaverSupplierName purchaseRate poDate deliveryDate items status labData createdAt updatedAt')
      .maxTimeMS(5000);

    // Log the order creation with complete details
    console.log('🔍 DEBUG: Order creation logging - populated order:', JSON.stringify(populatedOrder, null, 2));
    
    await logOrderChange('create', (order as any)._id.toString(), {}, { 
      orderId: populatedOrder.orderId,
      orderType: populatedOrder.orderType,
      arrivalDate: populatedOrder.arrivalDate,
      party: populatedOrder.party,
      contactName: populatedOrder.contactName,
      contactPhone: populatedOrder.contactPhone,
      poNumber: populatedOrder.poNumber,
      styleNo: populatedOrder.styleNo,
      weaverSupplierName: populatedOrder.weaverSupplierName,
      purchaseRate: populatedOrder.purchaseRate,
      poDate: populatedOrder.poDate,
      deliveryDate: populatedOrder.deliveryDate,
      status: populatedOrder.status,
      items: populatedOrder.items.map((item: any) => ({
        quality: item.quality,
        quantity: item.quantity,
        imageUrls: item.imageUrls || [],
        description: item.description
      }))
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
