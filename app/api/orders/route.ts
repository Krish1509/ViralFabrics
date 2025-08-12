import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Order, { IOrder } from '@/models/Order';

// GET /api/orders - Get all orders with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const party = searchParams.get('party');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    // Build filter object
    const filters: any = {};
    if (party) filters.party = party.toUpperCase();
    if (status) filters.status = status;
    if (search) {
      filters.$text = { $search: search };
    }
    
    const skip = (page - 1) * limit;
    
    // Execute queries in parallel for better performance
    const [orders, total] = await Promise.all([
      Order.find(filters)
        .lean()
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .select('orderNo party name status deliveryDate totalQuantity createdAt'),
      Order.countDocuments(filters)
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    return NextResponse.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['party', 'name', 'contactNumber', 'poNo', 'styleNo', 'poDate', 'deliveryDate', 'items'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Validate items array
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one item is required' },
        { status: 400 }
      );
    }
    
    // Validate each item
    for (const item of body.items) {
      if (!item.quality || !item.quantity) {
        return NextResponse.json(
          { success: false, error: 'Each item must have quality and quantity' },
          { status: 400 }
        );
      }
      
      if (item.quantity < 1) {
        return NextResponse.json(
          { success: false, error: 'Item quantity must be at least 1' },
          { status: 400 }
        );
      }
    }
    
    // Create order (orderNo will be auto-generated)
    const order = new Order({
      date: body.date || new Date(),
      party: body.party.toUpperCase(),
      name: body.name,
      contactNumber: body.contactNumber,
      poNo: body.poNo.toUpperCase(),
      styleNo: body.styleNo.toUpperCase(),
      poDate: new Date(body.poDate),
      deliveryDate: new Date(body.deliveryDate),
      items: body.items,
      status: body.status || 'pending'
    });
    
    const savedOrder = await order.save();
    
    return NextResponse.json({
      success: true,
      data: savedOrder,
      message: 'Order created successfully'
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error creating order:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return NextResponse.json(
        { success: false, error: `${field} already exists` },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
