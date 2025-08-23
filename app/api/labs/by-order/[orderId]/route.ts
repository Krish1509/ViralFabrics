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
    
    // Optimized: Get labs and order in parallel with minimal data
    const [labs, orderResult] = await Promise.all([
      Lab.find({
        order: orderId,
        softDeleted: false
      })
      .select('_id orderItemId status labSendDate labSendNumber remarks createdAt')
      .sort({ createdAt: -1 })
      .lean()
      .maxTimeMS(5000), // 5 second timeout
      
      Order.findById(orderId)
      .select('items._id items.quality')
      .lean()
      .maxTimeMS(3000) // 3 second timeout
    ]);
    
    if (!orderResult) {
      return notFound('Order not found');
    }
    
    const order = orderResult as any;
    
    // Create a map of order items for fast lookup
    const orderItemsMap = new Map();
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item: any) => {
        orderItemsMap.set(item._id.toString(), {
          _id: item._id,
          quality: item.quality
        });
      });
    }
    
    // Enhance lab data with minimal order item details
    const enhancedLabs = labs.map(lab => {
      const orderItem = orderItemsMap.get(lab.orderItemId.toString());
      return {
        ...lab,
        orderItem: orderItem || null
      };
    });
    
    // Add cache headers for better performance
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60', // Cache for 30 seconds
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: enhancedLabs 
      }), 
      { status: 200, headers }
    );
    
  } catch (error) {
    console.error('Error fetching labs by order:', error);
    return serverError(error);
  }
}
