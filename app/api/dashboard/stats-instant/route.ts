import { NextRequest, NextResponse } from 'next/server';
import { successResponse } from '@/lib/response';
import { Order } from '@/models';
import dbConnect from '@/lib/dbConnect';

// In-memory cache for ultra-fast loading
let dashboardCache = {
  data: null as any,
  timestamp: 0,
  ttl: 30 * 1000 // 30 seconds cache
};

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check cache first
    if (dashboardCache.data && Date.now() - dashboardCache.timestamp < dashboardCache.ttl) {
      const responseTime = Date.now() - startTime;
      return NextResponse.json(successResponse(dashboardCache.data, 'Dashboard stats loaded from cache'), { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
          'X-Cache': 'HIT',
          'X-Response-Time': `${responseTime}ms`
        }
      });
    }

    // Connect to database
    await dbConnect();

    // Build match conditions
    const matchConditions: any = { softDeleted: { $ne: true } };

    // Ultra-fast simple queries for real data
    const [totalCount, statusStats, typeStats, pendingTypeStats, deliveredTypeStats] = await Promise.all([
      // Total count
      Order.countDocuments(matchConditions).maxTimeMS(200),
      
      // Status stats - simple aggregation
      Order.aggregate([
        { $match: matchConditions },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]).option({ maxTimeMS: 200 }),
      
      // Type stats - simple aggregation
      Order.aggregate([
        { $match: matchConditions },
        { $group: { _id: '$orderType', count: { $sum: 1 } } }
      ]).option({ maxTimeMS: 200 }),
      
      // Pending type stats
      Order.aggregate([
        { 
          $match: {
            ...matchConditions,
            $or: [
              { status: { $in: ['pending', 'Not set', 'Not selected', null] } },
              { status: { $exists: false } }
            ]
          }
        },
        { $group: { _id: '$orderType', count: { $sum: 1 } } }
      ]).option({ maxTimeMS: 200 }),
      
      // Delivered type stats
      Order.aggregate([
        { 
          $match: {
            ...matchConditions,
            status: 'delivered'
          }
        },
        { $group: { _id: '$orderType', count: { $sum: 1 } } }
      ]).option({ maxTimeMS: 200 })
    ]);

    // Process the results
    const totalOrders = totalCount;
    
    // Process status stats
    const statusStatsMap: any = { pending: 0, in_progress: 0, completed: 0, delivered: 0, cancelled: 0, not_set: 0 };
    statusStats.forEach((stat: any) => {
      const status = stat._id || 'not_set';
      if (statusStatsMap.hasOwnProperty(status)) {
        statusStatsMap[status] = stat.count;
      } else {
        statusStatsMap.not_set += stat.count;
      }
    });

    // Process type stats
    const typeStatsMap: any = { Dying: 0, Printing: 0, not_set: 0 };
    typeStats.forEach((stat: any) => {
      const type = stat._id || 'not_set';
      if (typeStatsMap.hasOwnProperty(type)) {
        typeStatsMap[type] = stat.count;
      } else {
        typeStatsMap.not_set += stat.count;
      }
    });

    // Process pending type stats
    const pendingTypeStatsMap: any = { Dying: 0, Printing: 0, not_set: 0 };
    pendingTypeStats.forEach((stat: any) => {
      const type = stat._id || 'not_set';
      if (pendingTypeStatsMap.hasOwnProperty(type)) {
        pendingTypeStatsMap[type] = stat.count;
      } else {
        pendingTypeStatsMap.not_set += stat.count;
      }
    });

    // Process delivered type stats
    const deliveredTypeStatsMap: any = { Dying: 0, Printing: 0, not_set: 0 };
    deliveredTypeStats.forEach((stat: any) => {
      const type = stat._id || 'not_set';
      if (deliveredTypeStatsMap.hasOwnProperty(type)) {
        deliveredTypeStatsMap[type] = stat.count;
      } else {
        deliveredTypeStatsMap.not_set += stat.count;
      }
    });

    // Create the response data
    const dashboardData = {
      totalOrders,
      statusStats: statusStatsMap,
      typeStats: typeStatsMap,
      pendingTypeStats: pendingTypeStatsMap,
      deliveredTypeStats: deliveredTypeStatsMap,
      monthlyTrends: [], // Simplified for speed
      recentOrders: [] // Simplified for speed
    };

    // Update cache
    dashboardCache.data = dashboardData;
    dashboardCache.timestamp = Date.now();

    const responseTime = Date.now() - startTime;
    return NextResponse.json(successResponse(dashboardData, 'Dashboard stats loaded from database'), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
        'X-Cache': 'MISS',
        'X-Response-Time': `${responseTime}ms`
      }
    });

  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    
    // Return cached data if available, otherwise return empty data
    const fallbackData = dashboardCache.data || {
      totalOrders: 0,
      statusStats: { pending: 0, in_progress: 0, completed: 0, delivered: 0, cancelled: 0, not_set: 0 },
      typeStats: { Dying: 0, Printing: 0, not_set: 0 },
      pendingTypeStats: { Dying: 0, Printing: 0, not_set: 0 },
      deliveredTypeStats: { Dying: 0, Printing: 0, not_set: 0 },
      monthlyTrends: [],
      recentOrders: []
    };

    const responseTime = Date.now() - startTime;
    return NextResponse.json(successResponse(fallbackData, 'Dashboard stats loaded with fallback data'), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
        'X-Cache': 'FALLBACK',
        'X-Response-Time': `${responseTime}ms`
      }
    });
  }
}
