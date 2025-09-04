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
    const { orderId, mill, millDate, chalanNo, greighMtr, pcs, additionalMeters, notes } = body;

    // Debug logging
    console.log('API received body:', body);
    console.log('Additional meters received:', additionalMeters);
    console.log('Type of additionalMeters:', typeof additionalMeters);
    console.log('Is array?', Array.isArray(additionalMeters));

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

    // Validate additional meters if provided
    if (additionalMeters && Array.isArray(additionalMeters)) {
      for (let i = 0; i < additionalMeters.length; i++) {
        const additional = additionalMeters[i];
        if (!additional.greighMtr || additional.greighMtr <= 0) {
          return NextResponse.json(validationErrorResponse(`Valid greigh meters is required for additional entry ${i + 1}`), { status: 400 });
        }
        if (!additional.pcs || additional.pcs <= 0) {
          return NextResponse.json(validationErrorResponse(`Valid number of pieces is required for additional entry ${i + 1}`), { status: 400 });
        }
      }
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

    // Check if a mill input with the same orderId, mill, millDate, and chalanNo already exists
    const existingMillInput = await MillInput.findOne({
      orderId,
      mill,
      millDate: new Date(millDate),
      chalanNo: chalanNo.trim()
    });

    if (existingMillInput) {
      // Update existing record with additional meters
      if (additionalMeters && Array.isArray(additionalMeters)) {
        existingMillInput.additionalMeters = additionalMeters.map(additional => ({
          greighMtr: parseFloat(additional.greighMtr),
          pcs: parseInt(additional.pcs),
          notes: additional.notes?.trim()
        }));
        existingMillInput.notes = notes?.trim();
        await existingMillInput.save();
      }
    } else {
      // Create new mill input
      const millInput = new MillInput({
        orderId,
        order: order._id,
        mill,
        millDate: new Date(millDate),
        chalanNo: chalanNo.trim(),
        greighMtr: parseFloat(greighMtr),
        pcs: parseInt(pcs),
        additionalMeters: additionalMeters && Array.isArray(additionalMeters) ? additionalMeters.map(additional => ({
          greighMtr: parseFloat(additional.greighMtr),
          pcs: parseInt(additional.pcs),
          notes: additional.notes?.trim()
        })) : undefined,
        notes: notes?.trim(),
        // Test field to see if new fields are being saved
        testField: 'test_value_' + Date.now()
      });

              console.log('Creating new mill input with data:', {
          orderId,
          mill,
          millDate,
          chalanNo,
          greighMtr,
          pcs,
          additionalMeters: millInput.additionalMeters
        });

        await millInput.save();
        console.log('Mill input saved successfully with ID:', millInput._id);
      }

    // Get the final record (either updated or newly created)
    const finalMillInput = await MillInput.findOne({
      orderId,
      mill,
      millDate: new Date(millDate),
      chalanNo: chalanNo.trim()
    }).populate('mill', 'name contactPerson contactPhone')
      .populate('order', 'orderId orderType party')
      .lean();

    await logCreate('mill_input', (finalMillInput as any)?._id?.toString() || 'unknown', { 
      orderId, 
      chalanNo, 
      millName: millExists.name,
      hasAdditionalMeters: additionalMeters && additionalMeters.length > 0
    }, request);

    return NextResponse.json(createdResponse(finalMillInput, 'Mill input created successfully'));

  } catch (error: any) {
    console.error('Error creating mill input:', error);
    await logError('mill_input_create', 'mill_input', error.message, request);
    return NextResponse.json(errorResponse('Failed to create mill input'), { status: 500 });
  }
}
