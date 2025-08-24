import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireAuth } from '@/lib/session';
import { logError } from '@/lib/logger';

// GET /api/mill-outputs - Get all mill outputs
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

    const { MillOutput } = await import('@/models');
    const [millOutputs, total] = await Promise.all([
      MillOutput.find(query)
        .populate('order')
        .sort({ recdDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .catch(error => {
          console.log('Mill Output API: Populate failed in GET, using unpopulated data:', error);
          return MillOutput.find(query)
            .sort({ recdDate: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        }),
      MillOutput.countDocuments(query)
    ]);

    return NextResponse.json({
      success: true,
      data: millOutputs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError('view', 'order', errorMessage, request);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/mill-outputs - Create new mill output
export async function POST(request: NextRequest) {
  try {
    console.log('Mill Output API: Starting POST request');
    
    // Validate session
    // await requireAuth(request);
    console.log('Mill Output API: Session validation skipped');

    await dbConnect();
    console.log('Mill Output API: Database connected');

    const body = await request.json();
    console.log('Mill Output API: Request body:', body);
    
    const { orderId, recdDate, millBillNo, finishedMtr, millRate } = body;

    // Validate required fields
    if (!orderId || !recdDate || !millBillNo || !finishedMtr || !millRate) {
      console.log('Mill Output API: Missing required fields');
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate numeric fields
    if (isNaN(Number(finishedMtr)) || Number(finishedMtr) < 0) {
      return NextResponse.json(
        { error: 'Finished meters must be a valid positive number' },
        { status: 400 }
      );
    }

    if (isNaN(Number(millRate)) || Number(millRate) < 0) {
      return NextResponse.json(
        { error: 'Mill rate must be a valid positive number' },
        { status: 400 }
      );
    }

    // Find the order by orderId to get the ObjectId
    console.log('Mill Output API: Looking for order with orderId:', orderId);
    const { Order } = await import('@/models');
    const order = await Order.findOne({ orderId });
    
    if (!order) {
      console.log('Mill Output API: Order not found');
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    console.log('Mill Output API: Order found:', order._id);

    // Import and create MillOutput
    const { MillOutput } = await import('@/models');
    console.log('Mill Output API: Model imported successfully');
    
    // Create new mill output
    console.log('Mill Output API: Creating MillOutput document');
    const millOutputData = {
      orderId,
      order: order._id, // Use the actual ObjectId reference
      recdDate: new Date(recdDate),
      millBillNo: millBillNo.trim(),
      finishedMtr: Number(finishedMtr),
      millRate: Number(millRate)
    };
    
    console.log('Mill Output API: Data to create:', millOutputData);
    
    const millOutput = await MillOutput.create(millOutputData);
    console.log('Mill Output API: MillOutput created successfully:', millOutput._id);

    // Safely populate the order reference
    let populatedMillOutput;
    try {
      populatedMillOutput = await millOutput.populate('order');
      console.log('Mill Output API: Successfully populated order');
    } catch (populateError) {
      console.log('Mill Output API: Populate failed, using unpopulated document:', populateError);
      populatedMillOutput = millOutput;
    }

    return NextResponse.json({
      success: true,
      data: populatedMillOutput,
      message: 'Mill output created successfully'
    });

  } catch (error) {
    console.error('Mill Output API: Error occurred:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError('order_update', 'order', errorMessage, request);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error: ' + errorMessage 
      },
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
