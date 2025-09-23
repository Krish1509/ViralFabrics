import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Order from '@/models/Order';
import Counter from '@/models/Counter';
import { logDelete } from '@/lib/logger';

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    // Get the count of orders before deletion
    const orderCount = await Order.countDocuments();
    
    if (orderCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'No orders found to delete'
      }, { status: 400 });
    }

    // Delete all orders
    const deleteResult = await Order.deleteMany({});
    
    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'Failed to delete orders'
      }, { status: 500 });
    }

    // Reset the counter to 0
    await Counter.findByIdAndUpdate('orderId', { sequence: 0 }, { upsert: true });

    // Log the bulk deletion
    await logDelete('order', 'bulk', {
      deletedCount: deleteResult.deletedCount,
      action: 'delete_all_orders',
      previousOrderCount: orderCount
    }, request);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deleteResult.deletedCount} orders and reset counter to 0`,
      deletedCount: deleteResult.deletedCount
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to delete all orders',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
