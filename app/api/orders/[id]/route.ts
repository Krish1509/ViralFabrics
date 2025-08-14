import dbConnect from "@/lib/dbConnect";
import Order from "@/models/Order";
import Party from "@/models/Party";
import { requireAuth } from "@/lib/session";
import { type NextRequest } from "next/server";

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
      .select('_id orderId orderType arrivalDate party contactName contactPhone poNumber styleNo poDate deliveryDate items createdAt updatedAt');

    if (!order) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Order not found" 
        }), 
        { status: 404 }
      );
    }

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
      items
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
    
    // Validate items if provided
    if (items !== undefined) {
      if (!Array.isArray(items) || items.length === 0) {
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
    const existingOrder = await Order.findById(id);
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
    if (contactName !== undefined) updateData.contactName = contactName ? contactName.trim() : undefined;
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone ? contactPhone.trim() : undefined;
    if (poNumber !== undefined) updateData.poNumber = poNumber ? poNumber.trim() : undefined;
    if (styleNo !== undefined) updateData.styleNo = styleNo ? styleNo.trim() : undefined;
    if (poDate !== undefined) updateData.poDate = poDate ? new Date(poDate) : undefined;
    if (deliveryDate !== undefined) updateData.deliveryDate = deliveryDate ? new Date(deliveryDate) : undefined;
    if (items !== undefined) {
      updateData.items = items.map((item: any) => ({
        quality: item.quality || undefined,
        quantity: item.quantity !== undefined && item.quantity !== null ? item.quantity : undefined,
        imageUrl: item.imageUrl ? item.imageUrl.trim() : undefined,
        description: item.description ? item.description.trim() : undefined,
      }));
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('party', '_id name contactName contactPhone address')
    .populate('items.quality', '_id name description')
    .select('_id orderId orderType arrivalDate party contactName contactPhone poNumber styleNo poDate deliveryDate items createdAt updatedAt');

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
    // Remove authentication requirement for now
    // await requireAuth(req);

    await dbConnect();
    
    const { id } = await params;
    const order = await Order.findByIdAndDelete(id);

    if (!order) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Order not found" 
        }), 
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Order deleted successfully" 
      }), 
      { status: 200 }
    );
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
