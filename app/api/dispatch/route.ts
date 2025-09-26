import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireAuth } from '@/lib/session';
import { logError } from '@/lib/logger';
import mongoose from 'mongoose';

// GET /api/dispatch - Get all dispatch records
export async function GET(request: NextRequest) {
  try {
    // Validate session - temporarily disabled for testing
    // await requireAuth(request);

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Ultra fast - 50ms target
    const skip = (page - 1) * limit;

    let query: any = {};
    if (orderId) {
      query.orderId = orderId;
    }

    const { Dispatch } = await import('@/models');
    const [dispatches, total] = await Promise.all([
      Dispatch.find(query)
        .populate('order quality')
        .sort({ dispatchDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .maxTimeMS(200)
        .catch(error => {
          return Dispatch.find(query)
            .sort({ dispatchDate: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        }),
      Dispatch.countDocuments(query)
    ]);

    // If population failed, try to manually populate quality data
    if (dispatches.length > 0 && dispatches[0].quality && typeof dispatches[0].quality === 'string') {
      try {
        const { Quality } = await import('@/models');
        const qualityIds = [...new Set(dispatches.map(d => d.quality).filter(Boolean))];
        const qualities = await Quality.find({ _id: { $in: qualityIds } }).lean();
        const qualityMap = qualities.reduce((map, q: any) => {
          map[q._id.toString()] = q;
          return map;
        }, {} as any);

        dispatches.forEach(dispatch => {
          if (dispatch.quality && typeof dispatch.quality === 'string') {
            dispatch.quality = qualityMap[dispatch.quality] || dispatch.quality;
          }
        });
        } catch (manualPopulateError) {
        }
    }

    return NextResponse.json({
      success: true,
      data: dispatches,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError('view', 'dispatch', errorMessage, request);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/dispatch - Create new dispatch record
export async function POST(request: NextRequest) {
  try {
    // Validate session
    await requireAuth(request);
    await dbConnect();
    const body = await request.json();
    const { orderId, dispatchDate, billNo, finishMtr, saleRate, quality } = body;

    // Validate required fields
    if (!orderId || !dispatchDate || !billNo || !finishMtr) {
      return NextResponse.json(
        { error: 'Order ID, dispatch date, bill number, and finish meters are required' },
        { status: 400 }
      );
    }

    // Validate numeric fields
    if (isNaN(Number(finishMtr)) || Number(finishMtr) < 0) {
      return NextResponse.json(
        { error: 'Finish meters must be a valid positive number' },
        { status: 400 }
      );
    }

    // Validate saleRate if provided
    if (saleRate !== undefined && saleRate !== null && saleRate !== '') {
      if (isNaN(Number(saleRate)) || Number(saleRate) < 0) {
        return NextResponse.json(
          { error: 'Sale rate must be a valid positive number' },
          { status: 400 }
        );
      }
    }

    // Find the order by orderId to get the ObjectId
    const { Order } = await import('@/models');
    const order = await Order.findOne({ orderId });
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Import and create Dispatch
    const { Dispatch } = await import('@/models');
    // Create new dispatch record
    const finishMtrNum = Number(finishMtr);
    const saleRateNum = saleRate !== undefined && saleRate !== null && saleRate !== '' ? Number(saleRate) : 0;
    const totalValue = finishMtrNum * saleRateNum;
    
    // Handle quality ObjectId conversion
    let qualityObjectId = null;
    if (quality && quality.trim() !== '') {
      try {
        qualityObjectId = new mongoose.Types.ObjectId(quality);
        } catch (objectIdError) {
        qualityObjectId = null;
      }
    } else {
      }

    const dispatchData = {
      orderId,
      order: order._id, // Use the actual ObjectId reference
      dispatchDate: new Date(dispatchDate),
      billNo: billNo.trim(),
      finishMtr: finishMtrNum,
      saleRate: saleRateNum,
      quality: qualityObjectId,
      totalValue: totalValue
    };
    
    const dispatch = await Dispatch.create(dispatchData);
    // Safely populate the order and quality references
    let populatedDispatch;
    try {
      populatedDispatch = await dispatch.populate('order quality');
      } catch (populateError) {
      populatedDispatch = dispatch;
    }

    return NextResponse.json({
      success: true,
      data: populatedDispatch,
      message: 'Dispatch record created successfully'
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError('dispatch_create', 'dispatch', errorMessage, request);
    return NextResponse.json(
      { error: 'Internal server error: ' + errorMessage },
      { status: 500 }
    );
  }
}
