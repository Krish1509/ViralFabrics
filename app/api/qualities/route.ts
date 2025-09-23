import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Quality from '@/models/Quality';
import { 
  validateRequest, 
  createQualitySchema, 
  searchSchema,
  CreateQualityRequest,
  SearchRequest 
} from '@/lib/validation';
import { 
  ValidationError, 
  NotFoundError 
} from '@/lib/errors';
import { 
  sendSuccess, 
  sendCreated, 
  sendValidationError, 
  sendServerError,
  paginatedResponse,
  calculatePagination,
  buildQuery,
  buildSort
} from '@/lib/response';
import { logCreate } from '@/lib/logger';

// GET /api/qualities - List qualities with pagination and search
export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await dbConnect();
    
    // Parse query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50'); // Default limit for performance
    const search = url.searchParams.get('search') || '';
    
    // Build query
    const query: any = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
      query.isActive = true; // Only search active qualities
    }

    // Optimized query with limits and timeout
    const qualities = await Quality.find(query)
      .sort({ name: 1 })
      .limit(limit)
      .lean()
      .maxTimeMS(2000); // Reduced to 2 second timeout for faster response

    // Add cache headers
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
    };

    return new Response(JSON.stringify({
      success: true,
      data: qualities
    }), { status: 200, headers });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to retrieve qualities'
    }), { status: 500 });
  }
}

// POST /api/qualities - Create new quality
export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await dbConnect();
    
    // Parse and validate request body
    const body = await request.json();
    // Received quality data
    
    const validatedData = validateRequest(createQualitySchema, body);
    // Validated quality data

    // Check if quality with same name already exists
    const existingQuality = await Quality.findOne({ name: { $regex: validatedData.name, $options: 'i' } });
    if (existingQuality) {
      return NextResponse.json({
        success: false,
        message: 'Quality with this name already exists',
        timestamp: new Date().toISOString()
      }, { status: 409 });
    }

    // Create new quality
    const quality = new Quality(validatedData);
    const savedQuality = await quality.save();
    // Quality created successfully

    // Log the quality creation
    await logCreate('quality', (savedQuality as any)._id.toString(), { 
      name: savedQuality.name,
      description: savedQuality.description
    }, request);

    // Return success response
    const response = {
      success: true,
      data: savedQuality,
      message: 'Quality created successfully',
      timestamp: new Date().toISOString()
    };

    // Sending success response
    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({
        success: false,
        message: `Validation error: ${error.message}`,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      message: 'Failed to create quality - invalid data received',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
