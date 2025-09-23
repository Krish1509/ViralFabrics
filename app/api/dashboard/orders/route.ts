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
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

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

    // Build status filter
    const statusFilter: any = {};
    if (status && status !== 'all') {
      statusFilter.status = status;
    }

    // Combine filters
    const baseFilter = {
      $or: [
        { softDeleted: false },
        { softDeleted: { $exists: false } }
      ],
      ...dateFilter,
      ...orderTypeFilter,
      ...statusFilter
    };

    // Get orders with pagination
    const orders = await Order.find(baseFilter)
      .populate('party', 'name contactName contactPhone')
      .populate('items.quality', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .select('orderId orderType status party contactName contactPhone poNumber styleNo deliveryDate items createdAt updatedAt')
      .lean();

    // Get total count for pagination
    const total = await Order.countDocuments(baseFilter);

    // Get lab data for orders
    if (orders.length > 0) {
      try {
        const Lab = (await import('@/models/Lab')).default;
        const orderIds = orders.map(order => order._id);
        
        const labs = await Lab.find({ 
          order: { $in: orderIds },
          softDeleted: { $ne: true }
        })
        .select('orderItemId labSendDate labSendData labSendNumber status remarks')
        .lean();
        
        // Create a map of orderItemId to lab data
        const labMap = new Map();
        labs.forEach(lab => {
          labMap.set(lab.orderItemId.toString(), lab);
        });
        
        // Attach lab data to order items
        orders.forEach(order => {
          if (order.items) {
            order.items.forEach((item: any) => {
              const labData = labMap.get(item._id.toString());
              if (labData && labData.labSendData) {
                item.labData = {
                  color: labData.labSendData.color || '',
                  shade: labData.labSendData.shade || '',
                  notes: labData.labSendData.notes || '',
                  labSendDate: labData.labSendDate,
                  approvalDate: labData.labSendData.approvalDate,
                  sampleNumber: labData.labSendData.sampleNumber || '',
                  imageUrl: labData.labSendData.imageUrl || '',
                  labSendNumber: labData.labSendNumber || '',
                  status: labData.status || 'sent',
                  remarks: labData.remarks || ''
                };
              } else {
                item.labData = {
                  color: '',
                  shade: '',
                  notes: '',
                  labSendDate: null,
                  approvalDate: null,
                  sampleNumber: '',
                  imageUrl: '',
                  labSendNumber: '',
                  status: 'not_sent',
                  remarks: ''
                };
              }
            });
          }
        });
      } catch (labError) {
        }
    }

    const result = {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    return ok(result);

  } catch (error) {
    return serverError(error);
  }
}
