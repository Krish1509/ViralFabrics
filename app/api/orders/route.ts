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
    const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100); // Ultra small for 50ms target
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    const orderType = searchParams.get('orderType') || '';
    const status = searchParams.get('status') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    
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
      // Support multiple status values separated by commas
      const statusArray = status.split(',').map(s => s.trim());
      if (statusArray.length === 1) {
        query.status = statusArray[0];
      } else {
        query.status = { $in: statusArray };
      }
    }
    
    // Add date range filtering
    if (startDate && endDate) {
      query.deliveryDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Super optimized query with limits and proper indexing
    const orders = await Order.find(query)
      .populate('party', 'name contactName contactPhone address')
      .populate('items.quality', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean()
      .maxTimeMS(200); // 200ms timeout for 50ms target

    // Use Promise.all to parallelize lab data fetching, mill input data, and total count
    const [labs, millInputs, total] = await Promise.all([
      // Fetch lab data for all orders
      orders.length > 0 ? (async () => {
        try {
          const Lab = (await import('@/models/Lab')).default;
          const orderIds = orders.map(order => order._id);
          
          return await Lab.find({ 
            order: { $in: orderIds },
            softDeleted: { $ne: true }
          })
          .select('orderItemId labSendDate labSendData labSendNumber status remarks')
          .lean()
          .maxTimeMS(200);
        } catch (labError) {
          return [];
        }
      })() : Promise.resolve([]),
      
      // Fetch mill input data for process information
      orders.length > 0 ? (async () => {
        try {
          const { MillInput } = await import('@/models/Mill');
          const orderIds = orders.map(order => order._id);
          
          const millInputs = await MillInput.find({ 
            order: { $in: orderIds }
          })
          .select('order mill millDate chalanNo greighMtr pcs quality processName additionalMeters')
          .populate('mill', 'name')
          .populate('quality', 'name')
          .populate('additionalMeters.quality', 'name')
          .lean()
          .maxTimeMS(200);
          
          return millInputs;
        } catch (millError) {
          console.error('Mill input fetch error:', millError);
          return [];
        }
      })() : Promise.resolve([]),
      
      // Get total count in parallel
      Order.countDocuments(query).maxTimeMS(200)
    ]);

    // Attach lab data and mill input process data to order items
    if (orders.length > 0) {
      // Create a map of orderItemId to lab data
      const labMap = new Map();
      if (labs.length > 0) {
        labs.forEach(lab => {
          labMap.set(lab.orderItemId.toString(), lab);
        });
      }
      
      // Create a map of order ObjectId to mill input data
      const millInputMap = new Map();
      if (millInputs.length > 0) {
        millInputs.forEach(millInput => {
          millInputMap.set(millInput.order.toString(), millInput);
        });
      }
      
      // Attach lab data and process data to order items
      orders.forEach(order => {
        if (order.items) {
          order.items.forEach((item: any) => {
            // Attach lab data
            const labData = labMap.get(item._id.toString());
            if (labData && labData.labSendData) {
              item.labData = {
                color: labData.labSendData.color || '',
                shade: labData.labSendData.shade || '',
                notes: labData.labSendData.notes || '',
                labSendDate: labData.labSendDate,
                approvalDate: labData.labSendData.approvalDate,
                sampleNumber: labData.labSendData.sampleNumber || '',
                imageUrl: labData.labSendData.imageUrl || '',
                labSendNumber: labData.labSendNumber || '',
                status: labData.status || 'sent',
                remarks: labData.remarks || ''
              };
            } else {
              // Initialize empty lab data structure for items without lab data
              item.labData = {
                color: '',
                shade: '',
                notes: '',
                labSendDate: null,
                approvalDate: null,
                sampleNumber: '',
                imageUrl: '',
                labSendNumber: '',
                status: 'not_sent',
                remarks: ''
              };
            }
            
            // Attach quality-specific process data from mill inputs
            const millInputData = millInputMap.get(order._id.toString());
            if (millInputData) {
              const itemQualityId = item.quality?._id?.toString() || item.quality?.toString();
              const itemQualityName = item.quality?.name || item.quality;
              
              // Find process data for this specific quality
              let qualityProcessData = null;
              
              // Check main quality
              if (millInputData.quality?._id?.toString() === itemQualityId || 
                  millInputData.quality?.name === itemQualityName) {
                qualityProcessData = {
                  mainProcess: millInputData.processName || '',
                  additionalProcesses: []
                };
              }
              
              // Check additional meters for this quality
              if (!qualityProcessData && millInputData.additionalMeters) {
                const matchingAdditional = millInputData.additionalMeters.find((additional: any) => 
                  additional.quality?._id?.toString() === itemQualityId || 
                  additional.quality?.name === itemQualityName
                );
                
                if (matchingAdditional) {
                  qualityProcessData = {
                    mainProcess: matchingAdditional.processName || '',
                    additionalProcesses: []
                  };
                }
              }
              
              // If no quality-specific data found, use the main process data as fallback
              if (!qualityProcessData) {
                qualityProcessData = {
                  mainProcess: millInputData.processName || '',
                  additionalProcesses: millInputData.additionalMeters?.map((additional: any) => additional.processName || '') || []
                };
              }
              
              item.processData = qualityProcessData;
            } else {
              // Initialize empty process data structure
              item.processData = {
                mainProcess: '',
                additionalProcesses: []
              };
            }
          });
        }
        
        // Add mill inputs to each order for PDF generation
        (order as any).millInputs = millInputMap.get(order._id.toString()) || [];
      });
    }

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
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to fetch orders'
    }), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // Extract and validate request body
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
      status,
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
    
    // Validate status if provided - temporarily allow all valid statuses
    const validStatuses = ['Not set', 'Not selected', 'pending', 'in_progress', 'completed', 'delivered', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
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
        
        // Validate millRate if provided
        if (item.millRate !== undefined && item.millRate !== null && item.millRate !== '') {
          if (typeof item.millRate !== 'number' || item.millRate < 0) {
            errors.push(`Mill rate must be a non-negative number in item ${index + 1}`);
          }
        }
        
        // Validate salesRate if provided
        if (item.salesRate !== undefined && item.salesRate !== null && item.salesRate !== '') {
          if (typeof item.salesRate !== 'number' || item.salesRate < 0) {
            errors.push(`Sales rate must be a non-negative number in item ${index + 1}`);
          }
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

    // Use Promise.all to parallelize party and quality validation
    const validationPromises = [];
    
    // Add party validation promise if party is provided
    if (party && party !== '' && party !== 'null' && party !== 'undefined') {
      validationPromises.push(
        Party.findById(party).maxTimeMS(5000).then(partyExists => ({
          type: 'party',
          exists: !!partyExists,
          id: party
        }))
      );
    }
    
    // Add quality validation promises for all items
    if (items && items.length > 0) {
      const uniqueQualityIds = [...new Set(
        items
          .filter((item: any) => item.quality && item.quality !== '' && item.quality !== 'null' && item.quality !== 'undefined')
          .map((item: any) => item.quality)
      )];
      
      uniqueQualityIds.forEach(qualityId => {
        validationPromises.push(
          Quality.findById(qualityId).maxTimeMS(5000).then(qualityExists => ({
            type: 'quality',
            exists: !!qualityExists,
            id: qualityId
          }))
        );
      });
    }
    
    // Execute all validations in parallel
    if (validationPromises.length > 0) {
      const validationResults = await Promise.all(validationPromises);
      
      // Check validation results
      for (const result of validationResults) {
        if (!result.exists) {
          const message = result.type === 'party' 
            ? "Party not found" 
            : `Quality not found for item`;
          return new Response(
            JSON.stringify({ message }), 
            { status: 400 }
          );
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
        quality: item.quality && item.quality !== '' && item.quality !== 'null' && item.quality !== 'undefined' ? item.quality : undefined,
        quantity: item.quantity !== undefined && item.quantity !== null ? item.quantity : undefined,
        imageUrls: item.imageUrls && Array.isArray(item.imageUrls) ? item.imageUrls.map((url: string) => url.trim()) : [],
        description: item.description ? item.description.trim() : undefined,
        weaverSupplierName: item.weaverSupplierName ? item.weaverSupplierName.trim() : undefined,
        purchaseRate: item.purchaseRate !== undefined && item.purchaseRate !== null && item.purchaseRate !== '' ? 
          (() => {
            const rate = parseFloat(item.purchaseRate);
            return isNaN(rate) ? undefined : rate;
          })() : undefined,
        millRate: item.millRate !== undefined && item.millRate !== null && item.millRate !== '' ? 
          (() => {
            const rate = parseFloat(item.millRate);
            return isNaN(rate) ? undefined : rate;
          })() : undefined,
        salesRate: item.salesRate !== undefined && item.salesRate !== null && item.salesRate !== '' ? 
          (() => {
            const rate = parseFloat(item.salesRate);
            return isNaN(rate) ? undefined : rate;
          })() : undefined,
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
    if (status && status !== '' && status !== 'null' && status !== 'undefined') {
      orderData.status = status;
      } else {
      // Don't set status - let database default handle it
      }
    // Use the new sequential order creation method with timeout
    // Temporarily bypass schema validation for status
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

    if (!populatedOrder) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Failed to retrieve created order" 
        }), 
        { status: 500 }
      );
    }

    // Log the order creation with complete details including items
    const itemChanges = populatedOrder.items.map((item: any, index: number) => {
      const details = [];
      
      // Add quality details
      if (item.quality) {
        details.push(`Quality: "${item.quality.name || item.quality}"`);
      }
      
      // Add quantity details
      if (item.quantity) {
        details.push(`Quantity: ${item.quantity}`);
      }
      
      // Add description details
      if (item.description) {
        details.push(`Description: "${item.description}"`);
      }
      
      // Add weaver details
      if (item.weaverSupplierName) {
        details.push(`Weaver: "${item.weaverSupplierName}"`);
      }
      
      // Add purchase rate details
      if (item.purchaseRate) {
        details.push(`Rate: ₹${Number(item.purchaseRate).toFixed(2)}`);
      }
      
      // Add image details
      if (item.imageUrls && item.imageUrls.length > 0) {
        details.push(`${item.imageUrls.length} image(s)`);
      }
      
      return {
        type: 'item_added',
        index,
        item: {
          quality: item.quality?.name || item.quality || 'Not set',
          quantity: item.quantity || 0,
          description: item.description || '',
          weaverSupplierName: item.weaverSupplierName || '',
          purchaseRate: item.purchaseRate || 0,
          imageUrls: item.imageUrls || [],
          imageCount: (item.imageUrls || []).length
        }
      };
    });
    
    await logOrderChange('create', (order as any)._id.toString(), {}, { 
      orderId: populatedOrder.orderId,
      orderType: populatedOrder.orderType,
      arrivalDate: populatedOrder.arrivalDate,
      party: populatedOrder.party,
      contactName: populatedOrder.contactName,
      contactPhone: populatedOrder.contactPhone,
      poNumber: populatedOrder.poNumber,
      styleNo: populatedOrder.styleNo,
      poDate: populatedOrder.poDate,
      deliveryDate: populatedOrder.deliveryDate,
      status: populatedOrder.status,
      itemChanges: itemChanges
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
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: "Unauthorized" 
        }), { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      if (error.message.includes("Database connection failed")) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: "Database connection failed. Please try again." 
        }), { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      if (error.message.includes("Order creation timeout")) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: "Order creation timeout. Please try again." 
        }), { 
          status: 408,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Handle MongoDB duplicate key errors
      if (error.message.includes('E11000')) {
        if (error.message.includes('orderId')) {
          return new Response(
            JSON.stringify({ 
              success: false,
              message: "Order ID already exists. Please try again." 
            }), 
            { 
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      }
      
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values((error as any).errors).map((err: any) => err.message);
        return new Response(
          JSON.stringify({ 
            success: false,
            message: validationErrors.join(", ") 
          }), 
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }
    
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ 
      success: false,
      message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
