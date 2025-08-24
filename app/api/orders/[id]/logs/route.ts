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
    console.log('🔍 Logs API: Starting request for order ID:', await params);
    
    await dbConnect();
    
    const { id } = await params;
    console.log('🔍 Logs API: Order ID from params:', id);
    
    // Quick validation of order ID format
    if (!id || typeof id !== 'string' || id.length < 10) {
      console.log('🔍 Logs API: Invalid order ID format');
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
    
    // Skip order existence check for faster response - just try to get logs
    console.log('🔍 Logs API: Proceeding directly to logs query');

    // Optimized query for faster performance
    console.log('🔍 Logs API: Searching for logs with resource: order, resourceId:', id);
    
    const logs = await Log.find({
      resource: 'order',
      resourceId: id
    })
    .select('_id action username userRole timestamp success severity details')
    .sort({ timestamp: -1 })
    .limit(25) // Reduced limit for faster loading
    .lean()
    .maxTimeMS(3000) // Reduced timeout for faster response
    .hint({ resource: 1, resourceId: 1, timestamp: -1 }); // Use compound index
    
    console.log('🔍 Logs API: Found logs count:', logs.length);
    
    // Quick debug info only if logs are found
    if (logs.length > 0) {
      console.log('🔍 Logs API: Found logs count:', logs.length);
    } else {
      console.log('🔍 Logs API: No logs found for this order');
    }

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
    
    console.log('🔍 Logs API: Returning formatted logs:', formattedLogs.length);

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
