import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Log, { ILogModel } from '@/models/Log';
import { ok, badRequest, serverError, unauthorized } from '@/lib/http';
import { getSession } from '@/lib/session';
import { logView } from '@/lib/logger';

// GET /api/logs - Get logs with filtering and pagination
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    await dbConnect();
    
    // Check authentication
    const session = await getSession(request);
    if (!session) {
      return unauthorized('Authentication required');
    }
    
    // Allow both users and superadmins to view logs
    if (session.role !== 'superadmin' && session.role !== 'user') {
      return unauthorized('Authentication required');
    }
    
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    const {
      page = '1',
      limit = '50',
      cursor,
      userId,
      username,
      action,
      resource,
      resourceId,
      success,
      severity,
      startDate,
      endDate,
      excludeAction,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = queryParams;
    
    // Build filter object
    const filter: any = {};
    
    if (userId) filter.userId = userId;
    if (username) filter.username = { $regex: username, $options: 'i' };
    if (action) filter.action = action;
    if (resource) filter.resource = resource;
    if (resourceId) filter.resourceId = resourceId;
    if (success !== undefined) filter.success = success === 'true';
    if (severity) filter.severity = severity;
    
    // Exclude specific actions
    if (excludeAction) {
      filter.action = { $ne: excludeAction };
    }
    
    // Date range filter
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    
    // Optimized limit handling
    const limitNum = Math.min(parseInt(limit), 100); // Max 100 logs per request for performance
    const isLargeLimit = limitNum >= 50; // Consider large limit for "load all"
    
    // Sorting
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    let logs, hasMore, results;
    
    if (isLargeLimit && !cursor) {
      // For large limits without cursor, load logs with timeout
      logs = await Log.find(filter)
        .sort(sort)
        .limit(limitNum)
        .lean()
        .maxTimeMS(3000); // 3 second timeout
      hasMore = false;
      results = logs;
    } else {
      // Use cursor-based pagination for smaller limits or when cursor is provided
      let query = Log.find(filter).sort(sort).limit(limitNum + 1);
      
      // Add cursor-based pagination if cursor is provided
      if (cursor) {
        try {
          const cursorDate = new Date(cursor);
          if (sortOrder === 'desc') {
            filter[sortBy] = { ...filter[sortBy], $lt: cursorDate };
          } else {
            filter[sortBy] = { ...filter[sortBy], $gt: cursorDate };
          }
        } catch (error) {
          console.error('Invalid cursor format:', error);
          // Continue without cursor if it's invalid
        }
      }
      
      // Execute query with timeout
      logs = await query.lean().maxTimeMS(3000); // 3 second timeout
      
      // Check if there are more results
      hasMore = logs.length > limitNum;
      results = hasMore ? logs.slice(0, limitNum) : logs;
    }
    
    // Get total count for pagination info
    const total = await Log.countDocuments(filter).maxTimeMS(2000); // 2 second timeout
    
    // Get next cursor
    let nextCursor = null;
    if (hasMore && results.length > 0) {
      const lastLog = results[results.length - 1];
      nextCursor = lastLog[sortBy];
    }
    
    // Add cache headers
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
      'X-Response-Time': `${Date.now() - startTime}ms`
    };
    
    return new Response(JSON.stringify({
      success: true,
      logs: results,
      pagination: {
        hasMore,
        nextCursor,
        total,
        limit: limitNum
      }
    }), { headers });
    
  } catch (error) {
    console.error('Error fetching logs:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to fetch logs'
    }), { status: 500 });
  }
}

// DELETE /api/logs - Cleanup old logs (superadmin only)
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    
    // Check authentication
    const session = await getSession(request);
    if (!session) {
      return unauthorized('Authentication required');
    }
    
         // Allow both users and superadmins to delete logs
     if (session.role !== 'superadmin' && session.role !== 'user') {
       return unauthorized('Authentication required');
     }
    
    const { searchParams } = new URL(request.url);
    const daysToKeep = parseInt(searchParams.get('daysToKeep') || '90');
    
    if (daysToKeep < 1 || daysToKeep > 365) {
      return badRequest('daysToKeep must be between 1 and 365');
    }
    
    const result = await (Log as ILogModel).cleanupOldLogs(daysToKeep);
    
    return ok({
      message: `Cleaned up logs older than ${daysToKeep} days`,
      deletedCount: result.deletedCount
    });   
    
  } catch (error) {
    console.error('Error cleaning up logs:', error);
    return serverError(error);
  }
}
