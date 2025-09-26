import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { MillInput, Order, Mill, Quality } from '@/models';
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Ultra fast - 50ms target
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
    const totalCount = await MillInput.countDocuments(query).maxTimeMS(200);
    
    // Get mill inputs with pagination and populate references
    let millInputs;
    try {
      // Use a more robust population approach
      const queryBuilder = MillInput.find(query)
        .populate('mill', 'name contactPerson contactPhone')
        .populate('order', 'orderId orderType party')
        .maxTimeMS(200);
      
      // Try to populate quality fields safely
      try {
        queryBuilder.populate('quality', 'name');
        queryBuilder.populate('additionalMeters.quality', 'name');
      } catch (qualityError) {
        }
      
      millInputs = await queryBuilder
        .sort({ millDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
        
    } catch (populateError) {
      // Fallback: get basic data with minimal population
      millInputs = await MillInput.find(query)
        .populate('mill', 'name')
        .populate('order', 'orderId')
        .sort({ millDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    }

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
    const { orderId, mill, millDate, chalanNo, greighMtr, pcs, quality, processName, additionalMeters, notes } = body;

    // Debug logging
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
    // Quality is optional for now to maintain backward compatibility
    // if (!quality) {
    //   return NextResponse.json(validationErrorResponse('Quality is required'), { status: 400 });
    // }
    // Process name is optional
    // if (!processName || processName.trim() === '') {
    //   return NextResponse.json(validationErrorResponse('Process name is required'), { status: 400 });
    // }

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
        // Quality is optional for additional meters too
        // if (!additional.quality) {
        //   return NextResponse.json(validationErrorResponse(`Quality is required for additional entry ${i + 1}`), { status: 400 });
        // }
        // Process name is optional for additional meters
        // if (!additional.processName || additional.processName.trim() === '') {
        //   return NextResponse.json(validationErrorResponse(`Process name is required for additional entry ${i + 1}`), { status: 400 });
        // }
        
        // Check if additional quality exists only if provided
        if (additional.quality) {
          const additionalQualityExists = await Quality.findById(additional.quality);
          if (!additionalQualityExists) {
            return NextResponse.json(notFoundResponse(`Quality for additional entry ${i + 1}`), { status: 404 });
          }
        }
      }
    }

    // Check if order exists
    const order = await Order.findOne({ orderId });
    if (!order) {
      return NextResponse.json(notFoundResponse('Order'), { status: 404 });
    }

    // Check if mill exists
    const millExists = await Mill.findById(mill);
    if (!millExists) {
      return NextResponse.json(notFoundResponse('Mill'), { status: 404 });
    }

    // Check if quality exists only if provided
    if (quality) {
      const qualityExists = await Quality.findById(quality);
      if (!qualityExists) {
        return NextResponse.json(notFoundResponse('Quality'), { status: 404 });
      }
    }

    // Create new mill input (always create new record for each entry)
    const millInput = new MillInput({
      orderId,
      order: order._id,
      mill,
      millDate: new Date(millDate),
      chalanNo: chalanNo.trim(),
      greighMtr: parseFloat(greighMtr),
      pcs: parseInt(pcs),
      quality: quality || undefined,
      processName: processName ? processName.trim() : '',
      additionalMeters: additionalMeters && Array.isArray(additionalMeters) ? additionalMeters.map(additional => ({
        greighMtr: parseFloat(additional.greighMtr),
        pcs: parseInt(additional.pcs),
        quality: additional.quality || undefined,
        processName: additional.processName ? additional.processName.trim() : '',
        notes: additional.notes?.trim()
      })) : [],
      notes: notes?.trim()
    });

    await millInput.save();
    // Get the final record (newly created) - populate quality safely
    let finalMillInput;
    try {
      finalMillInput = await MillInput.findById(millInput._id)
        .populate('mill', 'name contactPerson contactPhone')
        .populate('order', 'orderId orderType party')
        .populate('quality', 'name')
        .populate('additionalMeters.quality', 'name')
        .lean();
    } catch (populateError) {
      // Fallback: get without quality population
      finalMillInput = await MillInput.findById(millInput._id)
        .populate('mill', 'name contactPerson contactPhone')
        .populate('order', 'orderId orderType party')
        .lean();
    }
    
    try {
      await logCreate('mill_input', (finalMillInput as any)?._id?.toString() || 'unknown', { 
        orderId, 
        chalanNo, 
        millName: millExists.name,
        hasAdditionalMeters: additionalMeters && additionalMeters.length > 0
      }, request);
    } catch (logError) {
      }

    return NextResponse.json(createdResponse(finalMillInput, 'Mill input created successfully'));

  } catch (error: any) {
    try {
      await logError('mill_input_create', 'mill_input', error.message, request);
    } catch (logError) {
      }
    return NextResponse.json(errorResponse('Failed to create mill input'), { status: 500 });
  }
}
