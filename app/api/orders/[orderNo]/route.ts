import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Order, { IOrder } from '@/models/Order';

// GET /api/orders/[orderNo] - Get order by order number
export async function GET(
  request: NextRequest,
  { params }: { params: { orderNo: string } }
) {
  try {
    await dbConnect();
    
    const order = await Order.findByOrderNo(params.orderNo);
    
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: order
    });
    
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PUT /api/orders/[orderNo] - Update order
export async function PUT(
  request: NextRequest,
  { params }: { params: { orderNo: string } }
) {
  try {
    await dbConnect();
    
    const body = await request.json();
    
    // Find the order first
    const existingOrder = await Order.findByOrderNo(params.orderNo);
    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Prepare update data
    const updateData: any = {};
    
    // Only update provided fields
    if (body.party) updateData.party = body.party.toUpperCase();
    if (body.name) updateData.name = body.name;
    if (body.contactNumber) updateData.contactNumber = body.contactNumber;
    if (body.poNo) updateData.poNo = body.poNo.toUpperCase();
    if (body.styleNo) updateData.styleNo = body.styleNo.toUpperCase();
    if (body.poDate) updateData.poDate = new Date(body.poDate);
    if (body.deliveryDate) updateData.deliveryDate = new Date(body.deliveryDate);
    if (body.status) updateData.status = body.status;
    if (body.items) {
      // Validate items if provided
      if (!Array.isArray(body.items) || body.items.length === 0) {
        return NextResponse.json(
          { success: false, error: 'At least one item is required' },
          { status: 400 }
        );
      }
      
      for (const item of body.items) {
        if (!item.quality || !item.quantity) {
          return NextResponse.json(
            { success: false, error: 'Each item must have quality and quantity' },
            { status: 400 }
          );
        }
        
        if (item.quantity < 1) {
          return NextResponse.json(
            { success: false, error: 'Item quantity must be at least 1' },
            { status: 400 }
          );
        }
      }
      
      updateData.items = body.items;
    }
    
    // Update the order
    const updatedOrder = await Order.findOneAndUpdate(
      { orderNo: params.orderNo.toUpperCase() },
      updateData,
      { new: true, runValidators: true }
    );
    
    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: 'Order updated successfully'
    });
    
  } catch (error: any) {
    console.error('Error updating order:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

// DELETE /api/orders/[orderNo] - Delete order
export async function DELETE(
  request: NextRequest,
  { params }: { params: { orderNo: string } }
) {
  try {
    await dbConnect();
    
    const order = await Order.findOneAndDelete({ 
      orderNo: params.orderNo.toUpperCase() 
    });
    
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}
