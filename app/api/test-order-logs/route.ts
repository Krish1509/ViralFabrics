import { NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Log from '@/models/Log';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    // Test order logs query
    const orderLogs = await Log.find({
      resource: 'order'
    })
    .limit(10)
    .lean();
    
    console.log('Order logs found:', orderLogs.length);
    
    // Get all unique resourceIds
    const resourceIds = [...new Set(orderLogs.map(log => log.resourceId))];
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Order logs query successful',
        totalOrderLogs: orderLogs.length,
        uniqueOrderIds: resourceIds,
        sampleLogs: orderLogs.slice(0, 3)
      }), 
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: unknown) {
    console.error('Test order logs error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message,
        error: error
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
