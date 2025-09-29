import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireAuth } from '@/lib/session';
import { logError } from '@/lib/logger';
import mongoose from 'mongoose';

// GET /api/mill-outputs - Get all mill outputs
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

    const { MillOutput } = await import('@/models');
    const [millOutputs, total] = await Promise.all([
      MillOutput.find(query)
        .populate('order quality')
        .sort({ recdDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .maxTimeMS(100) // Reduced timeout for faster response
        .catch(error => {
          return MillOutput.find(query)
            .sort({ recdDate: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
            .maxTimeMS(50); // Even faster fallback
        }),
      MillOutput.countDocuments(query).maxTimeMS(50) // Faster count query
    ]);

    // Ensure quality field is included even if null
    const millOutputsWithQuality = millOutputs.map(output => ({
      ...output,
      quality: output.quality || null
    }));

    return NextResponse.json({
      success: true,
      data: {
        millOutputs: millOutputsWithQuality,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalCount: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    }, {
      headers: {
        'Content-Type': 'application/json'
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
    // Validate session
    await requireAuth(request);
    await dbConnect();
    const body = await request.json();
    const { orderId, recdDate, millBillNo, finishedMtr, millRate, quality } = body;

    // Validate required fields
    if (!orderId || !recdDate || !millBillNo || !finishedMtr) {
      return NextResponse.json(
        { error: 'Order ID, received date, mill bill number, and finished meters are required' },
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

    // Validate millRate if provided
    if (millRate !== undefined && millRate !== null && millRate !== '') {
      if (isNaN(Number(millRate)) || Number(millRate) < 0) {
        return NextResponse.json(
          { error: 'Mill rate must be a valid positive number' },
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
    
    // Import and create MillOutput
    const { MillOutput } = await import('@/models');
    // Create new mill output
    const millOutputData = {
      orderId,
      order: order._id, // Use the actual ObjectId reference
      recdDate: new Date(recdDate),
      millBillNo: millBillNo.trim(),
      finishedMtr: Number(finishedMtr),
      millRate: millRate !== undefined && millRate !== null && millRate !== '' ? Number(millRate) : undefined,
      quality: quality && quality.trim() !== '' ? new mongoose.Types.ObjectId(quality) : null
    };
    
    const millOutput = await MillOutput.create(millOutputData);
    // Return the created mill output
    return NextResponse.json({
      success: true,
      data: millOutput.toObject(),
      message: 'Mill output created successfully'
    });

  } catch (error) {
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

