import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireAuth } from '@/lib/session';
import { logError } from '@/lib/logger';

// GET /api/dispatch - Get all dispatch records
export async function GET(request: NextRequest) {
  try {
    // Validate session
    // await requireAuth(request);

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    let query: any = {};
    if (orderId) {
      query.orderId = orderId;
    }

    const { Dispatch } = await import('@/models');
    const [dispatches, total] = await Promise.all([
      Dispatch.find(query)
        .populate('order')
        .sort({ dispatchDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .catch(error => {
          console.log('Dispatch API: Populate failed in GET, using unpopulated data:', error);
          return Dispatch.find(query)
            .sort({ dispatchDate: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        }),
      Dispatch.countDocuments(query)
    ]);

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
    console.log('Dispatch API: Starting POST request');
    
    // Validate session
    // await requireAuth(request);
    console.log('Dispatch API: Session validation skipped');

    await dbConnect();
    console.log('Dispatch API: Database connected');

    const body = await request.json();
    console.log('Dispatch API: Request body:', body);
    
    const { orderId, dispatchDate, billNo, finishMtr, saleRate } = body;

    // Validate required fields
    if (!orderId || !dispatchDate || !billNo || !finishMtr || !saleRate) {
      console.log('Dispatch API: Missing required fields');
      return NextResponse.json(
        { error: 'All fields are required' },
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

    if (isNaN(Number(saleRate)) || Number(saleRate) < 0) {
      return NextResponse.json(
        { error: 'Sale rate must be a valid positive number' },
        { status: 400 }
      );
    }

    // Find the order by orderId to get the ObjectId
    console.log('Dispatch API: Looking for order with orderId:', orderId);
    const { Order } = await import('@/models');
    const order = await Order.findOne({ orderId });
    
    if (!order) {
      console.log('Dispatch API: Order not found');
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    console.log('Dispatch API: Order found:', order._id);

    // Import and create Dispatch
    const { Dispatch } = await import('@/models');
    console.log('Dispatch API: Model imported successfully');
    
    // Create new dispatch record
    console.log('Dispatch API: Creating Dispatch document');
    const finishMtrNum = Number(finishMtr);
    const saleRateNum = Number(saleRate);
    const totalValue = finishMtrNum * saleRateNum;
    
    const dispatchData = {
      orderId,
      order: order._id, // Use the actual ObjectId reference
      dispatchDate: new Date(dispatchDate),
      billNo: billNo.trim(),
      finishMtr: finishMtrNum,
      saleRate: saleRateNum,
      totalValue: totalValue
    };
    
    console.log('Dispatch API: Data to create:', dispatchData);
    
    const dispatch = await Dispatch.create(dispatchData);
    console.log('Dispatch API: Dispatch created successfully:', dispatch._id);

    // Safely populate the order reference
    let populatedDispatch;
    try {
      populatedDispatch = await dispatch.populate('order');
      console.log('Dispatch API: Successfully populated order');
    } catch (populateError) {
      console.log('Dispatch API: Populate failed, using unpopulated document:', populateError);
      populatedDispatch = dispatch;
    }

    return NextResponse.json({
      success: true,
      data: populatedDispatch,
      message: 'Dispatch record created successfully'
    });

  } catch (error) {
    console.error('Dispatch API: Error occurred:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError('dispatch_create', 'dispatch', errorMessage, request);
    return NextResponse.json(
      { error: 'Internal server error: ' + errorMessage },
      { status: 500 }
    );
  }
}
