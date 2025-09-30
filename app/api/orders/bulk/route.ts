import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import dbConnect from '@/lib/dbConnect';
import Order from '@/models/Order';
import { unauthorizedResponse } from '@/lib/response';

export async function POST(req: NextRequest) {
  try {
    // Validate session
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json(unauthorizedResponse('Unauthorized'), { status: 401 });
    }

    await dbConnect();

    const { orderType, party, quantity } = await req.json();

    // Validation
    if (!orderType || !party || !quantity) {
      return NextResponse.json({ 
        success: false,
        message: 'Missing required fields: orderType, party, quantity' 
      }, { status: 400 });
    }

    if (typeof quantity !== 'number' || quantity <= 0) {
      return NextResponse.json({ 
        success: false,
        message: 'Quantity must be a positive number' 
      }, { status: 400 });
    }

    if (!['Dying', 'Printing', 'Bulk'].includes(orderType)) {
      return NextResponse.json({ 
        success: false,
        message: 'Order type must be Dying, Printing, or Bulk' 
      }, { status: 400 });
    }

    // Validate party ID format
    if (!party.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({ 
        success: false,
        message: 'Invalid party ID format' 
      }, { status: 400 });
    }

    // Create the order
    const orderData = {
      orderType,
      arrivalDate: new Date(),
      party,
      contactName: '',
      contactPhone: '',
      poNumber: `BULK-${Date.now()}`,
      styleNo: `BULK-${Date.now()}`,
      poDate: new Date(),
      deliveryDate: '',
      items: [{
        quality: '', // Empty quality for bulk orders
        quantity: quantity,
        imageUrls: [],
        description: `Bulk order - ${orderType}`,
        weaverSupplierName: '',
        purchaseRate: undefined,
        millRate: undefined,
        salesRate: undefined
      }]
    };

    const order = new Order(orderData);
    await order.save();

    return NextResponse.json({
      success: true,
      message: 'Bulk order created successfully',
      data: {
        orderId: order.orderId,
        _id: order._id,
        orderType: order.orderType,
        party: order.party,
        quantity: order.items[0].quantity,
        poNumber: order.poNumber,
        styleNo: order.styleNo
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Bulk order creation error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json({ 
        success: false,
        message: validationErrors.join(', ') 
      }, { status: 400 });
    }

    if (error.code === 11000) {
      return NextResponse.json({ 
        success: false,
        message: 'Order with this PO number already exists' 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: false,
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
