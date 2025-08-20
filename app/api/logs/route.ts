import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Log, { ILogModel } from '@/models/Log';
import { ok, badRequest, serverError, unauthorized } from '@/lib/http';
import { getSession } from '@/lib/session';
import { logView } from '@/lib/logger';

// GET /api/logs - Get logs with filtering and pagination
export async function GET(request: NextRequest) {
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
    
                       // Handle large limits (load all logs)
       const limitNum = Math.min(parseInt(limit), 99999); // Max 99999 logs per request
       const isLargeLimit = limitNum >= 1000; // Consider large limit for "load all"
      
       // Sorting
       const sort: any = {};
       sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
       
       let logs, hasMore, results;
       
       if (isLargeLimit && !cursor) {
         // For large limits without cursor, load all logs
         logs = await Log.find(filter).sort(sort).lean();
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
         
         // Re-apply filter after cursor modification
         query = Log.find(filter).sort(sort).limit(limitNum + 1);
         
         // Execute query
         logs = await query.lean();
         
         // Check if there are more results
         hasMore = logs.length > limitNum;
         results = hasMore ? logs.slice(0, limitNum) : logs;
       }
     
     // Get total count for first page only
     let total = 0;
     if (!cursor) {
       total = await Log.countDocuments(filter);
     }
    
    // Log this view action
    await logView('dashboard', undefined, request);
    
    // For large limits, return data directly without wrapping
    if (isLargeLimit && !cursor) {
      return NextResponse.json({
        logs: results,
        pagination: {
          hasMore,
          nextCursor: hasMore ? results[results.length - 1]?.timestamp : null,
          total,
          limit: limitNum
        }
      });
    }
    
    // For normal requests, use the ok helper
    return ok({
      logs: results,
      pagination: {
        hasMore,
        nextCursor: hasMore ? results[results.length - 1]?.timestamp : null,
        total,
        limit: limitNum
      }
    });
    
  } catch (error) {
    console.error('Error fetching logs:', error);
    return serverError(error);
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
