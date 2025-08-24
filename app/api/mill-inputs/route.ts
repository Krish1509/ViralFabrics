import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { MillInput, Order } from '@/models';
import { getSession } from '@/lib/session';
import { successResponse, errorResponse, validationErrorResponse, unauthorizedResponse, notFoundResponse, createdResponse } from '@/lib/response';
import { logCreate, logError } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Validate session
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(unauthorizedResponse('Unauthorized'), { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const millId = searchParams.get('millId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    let query = {};
    
    // Filter by order ID
    if (orderId) {
      query = { ...query, orderId };
    }
    
    // Filter by mill ID
    if (millId) {
      query = { ...query, mill: millId };
    }
    
    // Filter by date range
    if (startDate && endDate) {
      query = {
        ...query,
        millDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    // Get total count for pagination
    const totalCount = await MillInput.countDocuments(query);
    
    // Get mill inputs with pagination and populate references
    const millInputs = await MillInput.find(query)
      .populate('mill', 'name contactPerson contactPhone')
      .populate('order', 'orderId orderType party')
      .sort({ millDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json(successResponse({
      millInputs,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }, 'Mill inputs fetched successfully'));

  } catch (error: any) {
    console.error('Error fetching mill inputs:', error);
    return NextResponse.json(errorResponse('Failed to fetch mill inputs'), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    // Validate session
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(unauthorizedResponse('Unauthorized'), { status: 401 });
    }

    const body = await request.json();
    const { orderId, mill, millDate, chalanNo, greighMtr, pcs, notes } = body;

    // Validate required fields
    if (!orderId) {
      return NextResponse.json(validationErrorResponse('Order ID is required'), { status: 400 });
    }
    if (!mill) {
      return NextResponse.json(validationErrorResponse('Mill is required'), { status: 400 });
    }
    if (!millDate) {
      return NextResponse.json(validationErrorResponse('Mill date is required'), { status: 400 });
    }
    if (!chalanNo) {
      return NextResponse.json(validationErrorResponse('Chalan number is required'), { status: 400 });
    }
    if (!greighMtr || greighMtr <= 0) {
      return NextResponse.json(validationErrorResponse('Valid greigh meters is required'), { status: 400 });
    }
    if (!pcs || pcs <= 0) {
      return NextResponse.json(validationErrorResponse('Valid number of pieces is required'), { status: 400 });
    }

    // Check if order exists
    const order = await Order.findOne({ orderId });
    if (!order) {
      return NextResponse.json(notFoundResponse('Order'), { status: 404 });
    }

    // Check if mill exists
    const { Mill } = await import('@/models');
    const millExists = await Mill.findById(mill);
    if (!millExists) {
      return NextResponse.json(notFoundResponse('Mill'), { status: 404 });
    }

    // Check if chalan number already exists for this order
    const existingChalan = await MillInput.findOne({ 
      orderId, 
      chalanNo: chalanNo.trim() 
    });
    if (existingChalan) {
      return NextResponse.json(validationErrorResponse('Chalan number already exists for this order'), { status: 400 });
    }

    // Create new mill input
    const millInput = new MillInput({
      orderId,
      order: order._id,
      mill,
      millDate: new Date(millDate),
      chalanNo: chalanNo.trim(),
      greighMtr: parseFloat(greighMtr),
      pcs: parseInt(pcs),
      notes: notes?.trim()
    });

    await millInput.save();

    // Populate references for response
    const populatedMillInput = await MillInput.findById(millInput._id)
      .populate('mill', 'name contactPerson contactPhone')
      .populate('order', 'orderId orderType party')
      .lean();

    await logCreate('mill_input', millInput._id?.toString() || 'unknown', { 
      orderId, 
      chalanNo, 
      millName: millExists.name 
    }, request);

    return NextResponse.json(createdResponse(populatedMillInput, 'Mill input created successfully'));

  } catch (error: any) {
    console.error('Error creating mill input:', error);
    await logError('mill_input_create', 'mill_input', error.message, request);
    return NextResponse.json(errorResponse('Failed to create mill input'), { status: 500 });
  }
}
