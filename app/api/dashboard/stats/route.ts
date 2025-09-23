import { NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Order from '@/models/Order';
import { ok, serverError, unauthorized } from '@/lib/http';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Check authentication
    const session = await getSession(request);
    if (!session) {
      return unauthorized('Authentication required');
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const orderType = searchParams.get('orderType');

    // Build date filter
    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Build order type filter
    const orderTypeFilter: any = {};
    if (orderType && orderType !== 'all') {
      orderTypeFilter.orderType = orderType;
    }

    // Combine filters
    const baseFilter = {
      $or: [
        { softDeleted: false },
        { softDeleted: { $exists: false } }
      ],
      ...dateFilter,
      ...orderTypeFilter
    };

    // Get total orders count
    const totalOrders = await Order.countDocuments(baseFilter);

    // Get orders by status
    const statusCounts = await Order.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get orders by type
    const typeCounts = await Order.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: '$orderType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get monthly trends (last 12 months)
    const monthlyTrends = await Order.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    // Get recent orders (last 10)
    const recentOrders = await Order.find(baseFilter)
      .populate('party', 'name contactName')
      .populate('items.quality', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('orderId orderType status party items createdAt deliveryDate')
      .lean();

    // Calculate totals by status
    const statusStats = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      delivered: 0,
      cancelled: 0,
      not_set: 0
    };

    statusCounts.forEach(item => {
      const status = item._id || 'not_set';
      if (status in statusStats) {
        (statusStats as any)[status] = item.count;
      }
    });

    // Calculate totals by type
    const typeStats = {
      Dying: 0,
      Printing: 0,
      not_set: 0
    };

    typeCounts.forEach(item => {
      const type = item._id || 'not_set';
      if (type in typeStats) {
        (typeStats as any)[type] = item.count;
      }
    });

    // Format monthly trends
    const formattedTrends = monthlyTrends.map(trend => ({
      month: `${trend._id.year}-${String(trend._id.month).padStart(2, '0')}`,
      count: trend.count
    }));

    const stats = {
      totalOrders,
      statusStats,
      typeStats,
      monthlyTrends: formattedTrends,
      recentOrders
    };

    return ok(stats);

  } catch (error) {
    return serverError(error);
  }
}
