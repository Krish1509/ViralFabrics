import { NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Lab from '@/models/Lab';
import Order from '@/models/Order';
import Quality from '@/models/Quality';
import { createLabSchema, queryLabsSchema } from '@/lib/validation/lab';
import { ok, created, badRequest, notFound, conflict, serverError } from '@/lib/http';
import { ensureOrderItemExists } from '@/lib/ids';
import { logCreate, logView, logError } from '@/lib/logger';

// POST /api/labs - Create a new lab
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    
    // Validate request body
    const validationResult = createLabSchema.safeParse(body);
    if (!validationResult.success) {
      return badRequest(validationResult.error.issues[0].message);
    }
    
    const { orderId, orderItemId, ...labData } = validationResult.data;
    
    // Verify order exists and order item exists in that order
    // Skip validation for temporary orderItemIds (like item_0, item_1, etc.)
    if (!orderItemId.startsWith('item_')) {
      try {
        await ensureOrderItemExists(orderId, orderItemId);
      } catch (error) {
        return notFound((error as Error).message);
      }
    }
      
    // Check if lab already exists for this order item
    const existingLab = await Lab.findOne({ 
      order: orderId, 
      orderItemId: orderItemId,
      softDeleted: false 
    });
    
    if (existingLab) {
      return conflict('A lab already exists for this order item');
    }
    
    // Create the lab
    const lab = new Lab({
      order: orderId,
      orderItemId: orderItemId,
      ...labData
    });
    
    console.log('🔍 Creating lab with data:', { orderId, orderItemId, labData });
    
    await lab.save();
    
    console.log('🔍 Lab created successfully with ID:', lab._id.toString());
    
    // Log the lab creation
    try {
      await logCreate('lab', lab._id.toString(), { orderId, orderItemId, ...labData }, request);
      console.log('🔍 Lab creation logged successfully');
    } catch (logError) {
      console.error('🔍 Error logging lab creation:', logError);
      // Don't fail the request if logging fails
    }
    
    // Return the lab without populate to avoid any potential issues
    return created(lab);
    
  } catch (error) {
    console.error('Error creating lab:', error);
    
    // Check for duplicate key error specifically
    if (error instanceof Error && error.message.includes('E11000 duplicate key error')) {
      return conflict('A lab already exists for this order item');
    }
    
    await logError('lab_create', 'lab', error instanceof Error ? error.message : 'Unknown error', request);
    return serverError(error);
  }
}

// GET /api/labs - List labs with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    
    // Validate query parameters
    const validationResult = queryLabsSchema.safeParse(query);
    if (!validationResult.success) {
      return badRequest(validationResult.error.issues[0].message);
    }
    
    const { orderId, q, page, limit, status, includeDeleted } = validationResult.data;
    
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
    
    // Add cache headers for better performance
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60', // Cache for 30 seconds
    };
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          items: labs,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      }), 
      { status: 200, headers }
    );
    
  } catch (error) {
    console.error('Error fetching labs:', error);
    await logError('lab_view', 'lab', error instanceof Error ? error.message : 'Unknown error', request);
    return serverError(error);
  }
}
