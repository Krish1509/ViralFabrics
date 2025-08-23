import dbConnect from "@/lib/dbConnect";
import Order from "@/models/Order";
import Party from "@/models/Party";
import { requireAuth } from "@/lib/session";
import { type NextRequest } from "next/server";
import { logOrderChange, logView } from "@/lib/logger";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Remove authentication requirement for now
    // await requireAuth(req);

    await dbConnect();
    
    const { id } = await params;
    const order = await Order.findById(id)
      .populate('party', '_id name contactName contactPhone address')
      .populate('items.quality', '_id name description')
      .select('_id orderId orderType arrivalDate party contactName contactPhone poNumber styleNo poDate deliveryDate items status labData createdAt updatedAt');

    if (!order) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Order not found" 
        }), 
        { status: 404 }
      );
    }

    // Log the order view
    await logView('order', id, req);

    return new Response(JSON.stringify({ 
      success: true, 
      data: order 
    }), { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: "Unauthorized" 
        }), { status: 401 });
      }
    }
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ 
      success: false, 
      message 
    }), { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      items,
      status
    } = await req.json();

    // Validation
    const errors: string[] = [];
    
    if (orderType !== undefined && !['Dying', 'Printing'].includes(orderType)) {
      errors.push("Order type must be either 'Dying' or 'Printing'");
    }
    
    if (arrivalDate !== undefined) {
      const arrival = new Date(arrivalDate);
      if (isNaN(arrival.getTime())) {
        errors.push("Invalid arrival date format");
      }
    }
    
    if (party !== undefined) {
      if (!party.match(/^[0-9a-fA-F]{24}$/)) {
        errors.push("Invalid party ID format");
      }
    }
    
    if (contactName !== undefined && contactName && contactName.trim().length > 50) {
      errors.push("Contact name cannot exceed 50 characters");
    }
    
    if (contactPhone !== undefined && contactPhone && contactPhone.trim().length > 20) {
      errors.push("Contact phone cannot exceed 20 characters");
    }
    
    if (poNumber !== undefined && poNumber && poNumber.trim().length > 50) {
      errors.push("PO number cannot exceed 50 characters");
    }
    
    if (styleNo !== undefined && styleNo && styleNo.trim().length > 50) {
      errors.push("Style number cannot exceed 50 characters");
    }
    
    if (poDate !== undefined && poDate) {
      const po = new Date(poDate);
      if (isNaN(po.getTime())) {
        errors.push("Invalid PO date format");
      }
    }
    
    if (deliveryDate !== undefined && deliveryDate) {
      const delivery = new Date(deliveryDate);
      if (isNaN(delivery.getTime())) {
        errors.push("Invalid delivery date format");
      }
    }
    
    if (status !== undefined && !['pending', 'delivered'].includes(status)) {
      errors.push("Status must be one of: pending, delivered");
    }
    
    // Validate items if provided
    if (items !== undefined) {
      if (!Array.isArray(items) || items.length === 0) {
        errors.push("At least one order item is required");
      } else {
        items.forEach((item, index) => {
          // Quality is optional for each item
          if (item.quality && !item.quality.match(/^[0-9a-fA-F]{24}$/)) {
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
    }
    
    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ message: errors.join(", ") }), 
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if order exists
    const { id } = await params;
    const existingOrder = await Order.findById(id)
      .populate('party', '_id name')
      .populate('items.quality', '_id name');
    if (!existingOrder) {
      return new Response(
        JSON.stringify({ message: "Order not found" }), 
        { status: 404 }
      );
    }

    // Verify party exists if being updated
    if (party) {
      const partyExists = await Party.findById(party);
      if (!partyExists) {
        return new Response(
          JSON.stringify({ message: "Party not found" }), 
          { status: 400 }
        );
      }
    }

    // Verify qualities exist if being updated
    if (items && Array.isArray(items) && items.length > 0) {
      const Quality = (await import('@/models/Quality')).default;
      for (const item of items) {
        if (item && item.quality && typeof item.quality === 'string' && item.quality.trim()) {
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
      const targetParty = party || existingOrder.party;
      const existingDuplicate = await Order.findOne({
        _id: { $ne: id }, // Exclude current order
        party: targetParty,
        poNumber: poNumber.trim(),
        styleNo: styleNo.trim()
      });
      
      if (existingDuplicate) {
        return new Response(
          JSON.stringify({ 
            message: "An order with this PO number and style number already exists for this party" 
          }), 
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (orderType !== undefined) updateData.orderType = orderType;
    if (arrivalDate !== undefined) updateData.arrivalDate = new Date(arrivalDate);
    if (party !== undefined) updateData.party = party;
    if (contactName !== undefined) updateData.contactName = contactName !== null ? contactName.trim() : '';
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone !== null ? contactPhone.trim() : '';
    if (poNumber !== undefined) updateData.poNumber = poNumber !== null ? poNumber.trim() : '';
    if (styleNo !== undefined) updateData.styleNo = styleNo !== null ? styleNo.trim() : '';
    if (poDate !== undefined) updateData.poDate = poDate ? new Date(poDate) : undefined;
    if (deliveryDate !== undefined) updateData.deliveryDate = deliveryDate ? new Date(deliveryDate) : undefined;
    if (status !== undefined) updateData.status = status;
    if (items !== undefined) {
      updateData.items = items.map((item: any) => ({
        quality: item.quality || undefined,
        quantity: item.quantity !== undefined && item.quantity !== null ? item.quantity : undefined,
        imageUrls: item.imageUrls && Array.isArray(item.imageUrls) ? item.imageUrls.map((url: string) => url.trim()) : [],
        description: item.description !== null ? item.description.trim() : '',
      }));
    }

    // Capture old values for logging with complete details
    const oldValues = {
      orderType: existingOrder.orderType,
      arrivalDate: existingOrder.arrivalDate,
      party: existingOrder.party,
      contactName: existingOrder.contactName,
      contactPhone: existingOrder.contactPhone,
      poNumber: existingOrder.poNumber,
      styleNo: existingOrder.styleNo,
      poDate: existingOrder.poDate,
      deliveryDate: existingOrder.deliveryDate,
      status: existingOrder.status,
      items: existingOrder.items.map((item: any) => ({
        quality: item.quality,
        quantity: item.quantity,
        imageUrls: item.imageUrls || [],
        description: item.description
      }))
    };

    // First update the order without populate to avoid wasPopulated issues
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Failed to update order" 
        }), 
        { status: 500 }
      );
    }

    // Populate the updated order to get quality names for logging
    const populatedOrder = await Order.findById(id)
      .populate('party', '_id name')
      .populate('items.quality', '_id name');

    if (!populatedOrder) {
      console.error('Failed to populate order after update');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Failed to retrieve updated order" 
        }), 
        { status: 500 }
      );
    }

    console.log('🔍 DEBUG: Populated order for logging:', JSON.stringify(populatedOrder, null, 2));

    // Prepare new values for logging with complete details
    const newValues = {
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
      items: populatedOrder.items.map((item: any) => ({
        quality: item.quality,
        quantity: item.quantity,
        imageUrls: item.imageUrls || [],
        description: item.description
      }))
    };

    console.log('🔍 DEBUG: Old values for logging:', JSON.stringify(oldValues, null, 2));
    console.log('🔍 DEBUG: New values for logging:', JSON.stringify(newValues, null, 2));

    // Log the order update with complete change tracking
    await logOrderChange('update', id, oldValues, newValues, req);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Order updated successfully", 
        data: updatedOrder 
      }), 
      { status: 200 }
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    // Check if order exists
    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Order not found" 
        }), 
        { status: 404 }
      );
    }

    // Store order details for logging before deletion
    const orderDetails = {
      orderId: existingOrder.orderId,
      orderType: existingOrder.orderType,
      poNumber: existingOrder.poNumber,
      styleNo: existingOrder.styleNo,
      party: existingOrder.party,
      status: existingOrder.status
    };

    // Delete the order
    const deletedOrder = await Order.findByIdAndDelete(id);
    
    if (!deletedOrder) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Failed to delete order" 
        }), 
        { status: 500 }
      );
    }

         // Log the order deletion
     await logOrderChange('delete', id, orderDetails, {}, req);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Order deleted successfully" 
      }), 
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('DELETE error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message 
      }), 
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const { status } = await req.json();

    // Validate status
    const validStatuses = ['pending', 'delivered'];
    if (status && !validStatuses.includes(status)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Invalid status. Must be one of: pending, delivered" 
        }), 
        { status: 400 }
      );
    }

    // Check if order exists
    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Order not found" 
        }), 
        { status: 404 }
      );
    }

    // Store old status for logging
    const oldStatus = existingOrder.status;

    // First update the order without populate to avoid wasPopulated issues
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: false }
    );

    if (!updatedOrder) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Failed to update order status" 
        }), 
        { status: 500 }
      );
    }

    // Then populate the fields separately with proper error handling
    try {
      const populatedOrder = await Order.findById(updatedOrder._id)
        .populate('party', '_id name contactName contactPhone address')
        .populate('items.quality', '_id name description')
        .select('_id orderId orderType arrivalDate party contactName contactPhone poNumber styleNo poDate deliveryDate items status labData createdAt updatedAt');

             // Log the status change
       await logOrderChange('status_change', id, { status: oldStatus }, { status: updatedOrder.status }, req);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Order status updated successfully", 
          data: populatedOrder 
        }), 
        { status: 200 }
      );
    } catch (populateError) {
      console.error('Populate error:', populateError);
      // Return the order without populate if populate fails
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Order status updated successfully (some data may not be fully populated)", 
          data: updatedOrder 
        }), 
        { status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Order status updated successfully", 
        data: updatedOrder 
      }), 
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('PATCH error:', error);
    
    if (error instanceof Error) {
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values((error as any).errors).map((err: any) => err.message);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: validationErrors.join(", ") 
          }), 
          { status: 400 }
        );
      }
      
      // Handle MongoDB errors
      if (error.message.includes('E11000')) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Duplicate key error" 
          }), 
          { status: 400 }
        );
      }
    }
    
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ 
      success: false, 
      message 
    }), { status: 500 });
  }
}


