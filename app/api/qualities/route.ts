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

// GET /api/qualities - List qualities with pagination and search
export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await dbConnect();
    
    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    const validatedQuery = validateRequest(searchSchema, queryParams);
    const { page, limit, search, sortBy, sortOrder } = validatedQuery;

    // Build query
    const query = buildQuery({ search });
    if (search) {
      query.isActive = true; // Only search active qualities
    }

    // Build sort
    const sort = buildSort(sortBy, sortOrder);

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries in parallel for better performance
    const [qualities, total] = await Promise.all([
      Quality.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Quality.countDocuments(query)
    ]);

    // Calculate pagination info
    const pagination = calculatePagination(page, limit, total);

    // Return paginated response
    const response = paginatedResponse(qualities, pagination, 'Qualities retrieved successfully');
    
    return NextResponse.json(response);

  } catch (error) {
    if (error instanceof ValidationError) {
      return sendValidationError(NextResponse, error.message);
    }
    console.error('GET /api/qualities error:', error);
    return sendServerError(NextResponse, 'Failed to retrieve qualities');
  }
}

// POST /api/qualities - Create new quality
export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await dbConnect();
    
    // Parse and validate request body
    const body = await request.json();
    const validatedData = validateRequest(createQualitySchema, body);

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

    // Return success response
    const response = {
      success: true,
      data: savedQuality,
      message: 'Quality created successfully',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    if (error instanceof ValidationError) {
      return sendValidationError(NextResponse, error.message);
    }
    console.error('POST /api/qualities error:', error);
    return sendServerError(NextResponse, 'Failed to create quality');
  }
}
