import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Mill } from '@/models';
import { getSession } from '@/lib/session';
import { successResponse, errorResponse, validationErrorResponse, unauthorizedResponse, createdResponse } from '@/lib/response';
import { logCreate, logError } from '@/lib/logger';

// Professional in-memory cache for mills data
const millsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes for better performance

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check cache first
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100);
    const page = parseInt(searchParams.get('page') || '1');
    const cacheKey = `mills-${search || 'all'}-${limit}-${page}`;
    
    const cached = millsCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return NextResponse.json(successResponse(cached.data, 'Mills loaded from cache'), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
          'X-Cache': 'HIT',
          'X-Response-Time': `${Date.now() - startTime}ms`
        }
      });
    }

    await dbConnect();
    
    // Validate session - temporarily disabled for testing
    // const session = await getSession(request);
    // if (!session) {
    //   return NextResponse.json(unauthorizedResponse('Unauthorized'), { status: 401 });
    // }

    const skip = (page - 1) * limit;

    let query = {};
    
    // Add search functionality
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { contactPerson: { $regex: search, $options: 'i' } },
          { contactPhone: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Optimized parallel queries
    const [totalCount, mills] = await Promise.all([
      Mill.countDocuments(query).maxTimeMS(500),
      Mill.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .maxTimeMS(500)
        .lean()
    ]);

    const totalPages = Math.ceil(totalCount / limit);
    
    const responseData = {
      mills,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };

    // Update cache
    millsCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    return NextResponse.json(successResponse(responseData, 'Mills fetched successfully'), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        'X-Cache': 'MISS',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    });

  } catch (error: any) {
    return NextResponse.json(errorResponse('Failed to fetch mills'), { status: 500 });
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
    const { name, contactPerson, contactPhone, address, email } = body;

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return NextResponse.json(validationErrorResponse('Mill name is required'), { status: 400 });
    }

    // Check if mill with same name already exists
    const existingMill = await Mill.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (existingMill) {
      return NextResponse.json(validationErrorResponse('Mill with this name already exists'), { status: 400 });
    }

    // Create new mill
    const mill = new Mill({
      name: name.trim(),
      contactPerson: contactPerson?.trim(),
      contactPhone: contactPhone?.trim(),
      address: address?.trim(),
      email: email?.trim(),
      isActive: true
    });

    await mill.save();

    await logCreate('mill', mill._id?.toString() || 'unknown', { millName: mill.name }, request);

    return NextResponse.json(createdResponse(mill, 'Mill created successfully'));

  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(validationErrorResponse('Mill with this name already exists'), { status: 400 });
    }
    
    await logError('mill_create', 'mill', error.message, request);
    return NextResponse.json(errorResponse('Failed to create mill'), { status: 500 });
  }
}
