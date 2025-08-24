import { NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Lab } from '@/models';
import { Order, Quality } from '@/models';
import { ok, badRequest, notFound, serverError } from '@/lib/http';
import { isValidObjectId } from '@/lib/ids';

// GET /api/labs/by-order/[orderId] - Get all labs for a specific order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const startTime = Date.now();
  try {
    await dbConnect();
    
    const { orderId } = await params;
    
    // Validate ObjectId
    if (!isValidObjectId(orderId)) {
      return badRequest('Invalid order ID');
    }
    
    // Optimized: Get labs only with minimal data and faster timeout
    const labs = await Lab.find({
      order: orderId,
      softDeleted: false
    })
    .select('_id orderItemId status labSendDate labSendNumber remarks createdAt')
    .sort({ createdAt: -1 })
    .lean()
    .maxTimeMS(2000); // Reduced timeout to 2 seconds
    
    // Add cache headers for better performance
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=30, stale-while-revalidate=60', // Reduced cache for more frequent updates
      'X-Response-Time': `${Date.now() - startTime}ms`
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: labs 
      }), 
      { status: 200, headers }
    );
    
  } catch (error) {
    console.error('Error fetching labs by order:', error);
    return serverError(error);
  }
}
