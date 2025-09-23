import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Lab, Order, Quality } from '@/models';
import { getSession } from '@/lib/session';
import { successResponse, errorResponse, validationErrorResponse, unauthorizedResponse, createdResponse, conflictResponse } from '@/lib/response';
import { logCreate, logView, logError } from '@/lib/logger';

// POST /api/labs - Create a new lab
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    // Validate session
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(unauthorizedResponse('Unauthorized'), { status: 401 });
    }
    
    const body = await request.json();
    
    // Basic validation
    const { orderId, orderItemId, labSendDate, labSendNumber, labSendData, status, remarks } = body;
    
    if (!orderId) {
      return NextResponse.json(validationErrorResponse('Order ID is required'), { status: 400 });
    }
    
    if (!orderItemId) {
      return NextResponse.json(validationErrorResponse('Order item ID is required'), { status: 400 });
    }
    
    if (!labSendDate) {
      return NextResponse.json(validationErrorResponse('Lab send date is required'), { status: 400 });
    }
    
    // Check if lab already exists for this order item
    const existingLab = await Lab.findOne({ 
      order: orderId, 
      orderItemId: orderItemId,
      softDeleted: false 
    });
    
    if (existingLab) {
      return NextResponse.json(conflictResponse('A lab already exists for this order item'), { status: 409 });
    }
    
    // Create the lab with proper structure and defaults
    const lab = new Lab({
      order: orderId,
      orderItemId: orderItemId,
      labSendDate: new Date(labSendDate),
      labSendNumber: labSendNumber?.trim() || '',
      labSendData: {
        color: labSendData?.color || '',
        shade: labSendData?.shade || '',
        notes: labSendData?.notes || '',
        sampleNumber: labSendData?.sampleNumber || '',
        imageUrl: labSendData?.imageUrl || '',
        approvalDate: labSendData?.approvalDate ? new Date(labSendData.approvalDate) : null,
        specifications: labSendData?.specifications || {}
      },
      status: status || 'sent',
      remarks: remarks?.trim() || ''
    });
    
    await lab.save();
    
    // Log the lab creation
    try {
      await logCreate('lab', lab._id?.toString() || 'unknown', { orderId, orderItemId }, request);
    } catch (logError) {
      // Don't fail the request if logging fails
    }
    
    return NextResponse.json(createdResponse(lab, 'Lab created successfully'));
    
  } catch (error: any) {
    // Check for duplicate key error specifically
    if (error.code === 11000) {
      return NextResponse.json(conflictResponse('A lab already exists for this order item'), { status: 409 });
    }
    
    await logError('lab_create', 'lab', error.message || 'Unknown error', request);
    return NextResponse.json(errorResponse('Failed to create lab'), { status: 500 });
  }
}

// GET /api/labs - List labs with pagination and filtering
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
    const q = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const includeDeleted = searchParams.get('includeDeleted') === 'true';
    
    // Build filter object
    const filter: any = {};
    
    if (!includeDeleted) {
      filter.softDeleted = false;
    }
    
    if (orderId) {
      filter.order = orderId;
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (q) {
      filter.$text = { $search: q };
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Optimized: Use simple find instead of aggregation for better performance
    const [labs, total] = await Promise.all([
      Lab.find(filter)
        .select('_id order orderItemId status labSendDate labSendNumber remarks createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .maxTimeMS(8000), // 8 second timeout
      
      Lab.countDocuments(filter)
        .maxTimeMS(3000) // 3 second timeout
    ]);
    
    return NextResponse.json(successResponse({
      items: labs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Labs fetched successfully'));
    
  } catch (error: any) {
    await logError('lab_view', 'lab', error.message || 'Unknown error', request);
    return NextResponse.json(errorResponse('Failed to fetch labs'), { status: 500 });
  }
}
