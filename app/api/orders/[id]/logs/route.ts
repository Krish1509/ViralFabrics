import { NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Log from '@/models/Log';
import Order from '@/models/Order';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    // Check if order exists (use lean for faster query)
    const order = await Order.findById(id).lean().select('_id');
    if (!order) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Order not found" 
        }), 
        { status: 404 }
      );
    }

    // Simplified query without hint for better compatibility
    const logs = await Log.find({
      resource: 'order',
      resourceId: id
    })
    .select('_id action username userRole timestamp success severity details ipAddress userAgent')
    .sort({ timestamp: -1 })
    .limit(50)
    .lean();

    // Format logs for better display (simplified)
    const formattedLogs = logs.map((log: any) => ({
      id: log._id.toString(),
      action: log.action,
      username: log.username,
      userRole: log.userRole,
      timestamp: log.timestamp,
      success: log.success,
      severity: log.severity,
      details: log.details || {},
      ipAddress: log.ipAddress,
      userAgent: log.userAgent
    }));

    // Add cache headers for better performance
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: formattedLogs 
      }), 
      { status: 200, headers }
    );
  } catch (error: unknown) {
    console.error('Error fetching order logs:', error);
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
