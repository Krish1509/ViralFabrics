import { NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Log from '@/models/Log';
import Order from '@/models/Order';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  try {
    await dbConnect();
    
    const { id } = await params;
    
    // Quick validation of order ID format
    if (!id || typeof id !== 'string' || id.length < 10) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: [] 
        }), 
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'X-Response-Time': `${Date.now() - startTime}ms`
          }
        }
      );
    }
    
    // Only show important order-related operations
    const importantOrderActions = [
      'order_create', 'order_update', 'order_delete', 'order_status_change',
      'lab_create', 'lab_update', 'lab_delete', 'lab_status_change'
    ];
    
    const logs = await Log.find({
      resource: 'order',
      resourceId: id,
      action: { $in: importantOrderActions }
    })
    .select('_id action username userRole timestamp success severity details')
    .sort({ timestamp: -1 })
    .limit(20) // Further reduced limit for faster loading
    .lean()
    .maxTimeMS(2000); // Further reduced timeout for faster response

    // Enhanced log formatting with detailed change information
    const formattedLogs = logs.map((log: any) => ({
      id: log._id.toString(),
      action: log.action,
      username: log.username,
      userRole: log.userRole,
      timestamp: log.timestamp,
      success: log.success,
      severity: log.severity,
      details: {
        ipAddress: log.details?.ipAddress,
        userAgent: log.details?.userAgent,
        oldValues: log.details?.oldValues,
        newValues: log.details?.newValues,
        changeSummary: log.details?.changeSummary,
        method: log.details?.method,
        endpoint: log.details?.endpoint,
        requestBody: log.details?.requestBody,
        responseStatus: log.details?.responseStatus,
        errorMessage: log.details?.errorMessage,
        metadata: log.details?.metadata
      }
    }));

    // Disable caching for real-time logs
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Response-Time': `${Date.now() - startTime}ms`
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
    
    // Handle MongoDB specific errors
    let message = 'Unknown error occurred';
    if (error instanceof Error) {
      if (error.message.includes('hint provided does not correspond to an existing index')) {
        message = 'Database index error - please contact administrator';
      } else if (error.message.includes('timeout')) {
        message = 'Request timeout - please try again';
      } else {
        message = error.message;
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message,
        data: [] // Return empty array instead of error details for security
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
