import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Order from '@/models/Order';
import { getSession } from '@/lib/session';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Validate session
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(unauthorizedResponse('Unauthorized'), { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Build query based on filters
    let query = {};
    
    // Add date filters if provided
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate && endDate) {
      query = {
        ...query,
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    // Add order type filter if provided
    const orderType = searchParams.get('orderType');
    if (orderType && orderType !== 'all') {
      query = { ...query, orderType };
    }

    // Get total count for pagination
    const totalCount = await Order.countDocuments(query).maxTimeMS(1000);
    
    // Get orders with pagination and populate references
    const orders = await Order.find(query)
      .populate('party', 'name contactPerson contactPhone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .maxTimeMS(1000);

    const totalPages = Math.ceil(totalCount / limit);

    // Add aggressive cache headers
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
    };

    return NextResponse.json(successResponse({
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }, 'Orders fetched successfully'), { 
      status: 200, 
      headers 
    });

  } catch (error: any) {
    return NextResponse.json(errorResponse('Failed to fetch orders'), { status: 500 });
  }
}