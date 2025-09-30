import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Order from '@/models/Order';

export async function POST(req: NextRequest) {
  try {
    // Validate session
    const session = await getSession(req);
    if (!session) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { orderType, party, quantity } = await req.json();

    // Validation
    if (!orderType || !party || !quantity) {
      return Response.json({ 
        message: 'Missing required fields: orderType, party, quantity' 
      }, { status: 400 });
    }

    if (typeof quantity !== 'number' || quantity <= 0) {
      return Response.json({ 
        message: 'Quantity must be a positive number' 
      }, { status: 400 });
    }

    if (!['Dying', 'Printing', 'Bulk'].includes(orderType)) {
      return Response.json({ 
        message: 'Order type must be Dying, Printing, or Bulk' 
      }, { status: 400 });
    }

    // Validate party ID format
    if (!party.match(/^[0-9a-fA-F]{24}$/)) {
      return Response.json({ 
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

    return Response.json({
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
    });

  } catch (error: any) {
    console.error('Bulk order creation error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return Response.json({ 
        message: validationErrors.join(', ') 
      }, { status: 400 });
    }

    if (error.code === 11000) {
      return Response.json({ 
        message: 'Order with this PO number already exists' 
      }, { status: 400 });
    }

    return Response.json({ 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
