import { NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Lab from '@/models/Lab';
import Order from '@/models/Order';
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
    
    await lab.save();
    
    // Log the lab creation
    await logCreate('lab', lab._id.toString(), { orderId, orderItemId, ...labData }, request);
    
    // Try to populate order details, but don't fail if it doesn't work
    try {
      await lab.populate('order');
    } catch (populateError) {
      console.log('Populate failed but lab was created successfully:', populateError);
      // Continue without populate - the lab was still created successfully
    }
    
    return created(lab);
    
  } catch (error) {
    console.error('Error creating lab:', error);
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
    
    // Execute query with aggregation for better performance
    const pipeline: any[] = [
      { $match: filter },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ];
    
    // Add lookup to get order details
    pipeline.push({
      $lookup: {
        from: 'orders',
        localField: 'order',
        foreignField: '_id',
        as: 'orderDetails'
      }
    });
    
    pipeline.push({
      $addFields: {
        orderDetails: { $arrayElemAt: ['$orderDetails', 0] }
      }
    });
    
    // Get total count for pagination
    const totalPipeline = [
      { $match: filter },
      { $count: 'total' }
    ];
    
    const [labs, totalResult] = await Promise.all([
      Lab.aggregate(pipeline),
      Lab.aggregate(totalPipeline)
    ]);
    
    const total = totalResult[0]?.total || 0;
    
    // Log the labs view
    await logView('lab', undefined, request);
    
    return ok({
      items: labs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching labs:', error);
    await logError('lab_view', 'lab', error instanceof Error ? error.message : 'Unknown error', request);
    return serverError(error);
  }
}
