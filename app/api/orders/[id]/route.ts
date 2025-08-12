import dbConnect from "@/lib/dbConnect";
import Order from "@/models/Order";
import Party from "@/models/Party";
import { requireAuth } from "@/lib/session";
import { type NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    await requireAuth(req);

    await dbConnect();
    
    const order = await Order.findById(params.id)
      .populate('party', '_id name contactName contactPhone address')
      .select('_id orderId orderType arrivalDate party contactName contactPhone poNumber styleNo poDate deliveryDate quality quantity imageUrl createdAt updatedAt');

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
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    await requireAuth(req);

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
      quality,
      quantity,
      imageUrl
    } = await req.json();

    // Validation
    const errors: string[] = [];
    
    if (orderType !== undefined && !['Bulk', 'Sample'].includes(orderType)) {
      errors.push("Order type must be either 'Bulk' or 'Sample'");
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
    
    if (quality !== undefined && quality && quality.trim().length > 100) {
      errors.push("Quality description cannot exceed 100 characters");
    }
    
    if (quantity !== undefined && quantity !== null) {
      if (typeof quantity !== 'number' || quantity < 0) {
        errors.push("Quantity must be a non-negative number");
      }
    }
    
    if (imageUrl !== undefined && imageUrl && imageUrl.trim().length > 500) {
      errors.push("Image URL cannot exceed 500 characters");
    }
    
    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ message: errors.join(", ") }), 
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if order exists
    const existingOrder = await Order.findById(params.id);
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

    // Check for duplicate PO + Style combination for the same party
    if (poNumber && styleNo) {
      const targetParty = party || existingOrder.party;
      const existingDuplicate = await Order.findOne({
        _id: { $ne: params.id }, // Exclude current order
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
    if (quality !== undefined) updateData.quality = quality ? quality.trim() : undefined;
    if (quantity !== undefined) updateData.quantity = quantity !== null ? quantity : undefined;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl ? imageUrl.trim() : undefined;

    const updatedOrder = await Order.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('party', '_id name contactName contactPhone address')
    .select('_id orderId orderType arrivalDate party contactName contactPhone poNumber styleNo poDate deliveryDate quality quantity imageUrl createdAt updatedAt');

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
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    await requireAuth(req);

    await dbConnect();
    
    const order = await Order.findByIdAndDelete(params.id);

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
