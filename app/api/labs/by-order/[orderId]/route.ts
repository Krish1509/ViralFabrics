import { NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Lab from '@/models/Lab';
import Order from '@/models/Order';
import { ok, badRequest, notFound, serverError } from '@/lib/http';
import { isValidObjectId } from '@/lib/ids';

// GET /api/labs/by-order/[orderId] - Get all labs for a specific order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    await dbConnect();
    
    const { orderId } = await params;
    
    // Validate ObjectId
    if (!isValidObjectId(orderId)) {
      return badRequest('Invalid order ID');
    }
    
    // Verify order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return notFound('Order not found');
    }
    
        // Get all labs for this order with order details
    const labs = await Lab.find({
      order: orderId,
      softDeleted: false
    }).populate('order').sort({ createdAt: -1 }).lean();
    
    // Create a map of order items for easy lookup
    const orderItemsMap = new Map();
    order.items.forEach((item: any) => {
      orderItemsMap.set(item._id.toString(), item);
    });
    
    // Enhance lab data with order item details
    const enhancedLabs = labs.map(lab => {
      const orderItem = orderItemsMap.get(lab.orderItemId.toString());
      return {
        ...lab,
        orderItem: orderItem || null
      };
    });
    
    return ok(enhancedLabs);
    
  } catch (error) {
    console.error('Error fetching labs by order:', error);
    return serverError(error);
  }
}
