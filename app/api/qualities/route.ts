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

// Professional in-memory cache for qualities data
const qualitiesCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes for better performance

// GET /api/qualities - List qualities with pagination and search
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check cache first
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '25'), 100);
    const search = url.searchParams.get('search') || '';
    const cacheKey = `qualities-${search || 'all'}-${limit}`;
    
    const cached = qualitiesCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        message: 'Qualities loaded from cache'
      }, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
          'X-Cache': 'HIT',
          'X-Response-Time': `${Date.now() - startTime}ms`
        }
      });
    }

    // Connect to database
    await dbConnect();
    
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
      .maxTimeMS(200); // 200ms timeout for 50ms target

    // Update cache
    qualitiesCache.set(cacheKey, {
      data: qualities,
      timestamp: Date.now()
    });

    return new Response(JSON.stringify({
      success: true,
      data: qualities,
      message: 'Qualities fetched successfully'
    }), { 
      status: 200, 
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        'X-Cache': 'MISS',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    });

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
