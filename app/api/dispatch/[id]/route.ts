import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Dispatch } from '@/models';
import { getSession } from '@/lib/session';
import { successResponse, errorResponse, validationErrorResponse, unauthorizedResponse, notFoundResponse, updatedResponse, deletedResponse } from '@/lib/response';
import { logUpdate, logDelete, logError } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    // Validate session
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(unauthorizedResponse('Unauthorized'), { status: 401 });
    }

    const { id } = await params;

    const dispatch = await Dispatch.findById(id)
      .populate('order', 'orderId orderType party')
      .lean();
    
    if (!dispatch) {
      return NextResponse.json(notFoundResponse('Dispatch'), { status: 404 });
    }

    return NextResponse.json(successResponse(dispatch, 'Dispatch fetched successfully'));

  } catch (error: any) {
    console.error('Error fetching dispatch:', error);
    return NextResponse.json(errorResponse('Failed to fetch dispatch'), { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    // Validate session
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(unauthorizedResponse('Unauthorized'), { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { dispatchDate, billNo, finishMtr, saleRate } = body;

    // Check if dispatch exists
    const existingDispatch = await Dispatch.findById(id);
    if (!existingDispatch) {
      return NextResponse.json(notFoundResponse('Dispatch'), { status: 404 });
    }

    // Validate required fields
    if (!dispatchDate) {
      return NextResponse.json(validationErrorResponse('Dispatch date is required'), { status: 400 });
    }
    if (!billNo) {
      return NextResponse.json(validationErrorResponse('Bill number is required'), { status: 400 });
    }
    if (!finishMtr || finishMtr <= 0) {
      return NextResponse.json(validationErrorResponse('Valid finish meters is required'), { status: 400 });
    }
    if (!saleRate || saleRate <= 0) {
      return NextResponse.json(validationErrorResponse('Valid sale rate is required'), { status: 400 });
    }

    // Calculate total value
    const totalValue = parseFloat(finishMtr) * parseFloat(saleRate);

    // Update dispatch
    const updatedDispatch = await Dispatch.findByIdAndUpdate(
      id,
      {
        dispatchDate: new Date(dispatchDate),
        billNo: billNo.trim(),
        finishMtr: parseFloat(finishMtr),
        saleRate: parseFloat(saleRate),
        totalValue: totalValue
      },
      { new: true, runValidators: true }
    );

    if (!updatedDispatch) {
      return NextResponse.json(notFoundResponse('Dispatch'), { status: 404 });
    }

    // Populate references for response
    const populatedDispatch = await Dispatch.findById(updatedDispatch._id)
      .populate('order', 'orderId orderType party')
      .lean();

    await logUpdate('dispatch', id, { 
      oldBillNo: existingDispatch.billNo 
    }, { 
      newBillNo: updatedDispatch.billNo 
    }, request);

    return NextResponse.json(updatedResponse(populatedDispatch, 'Dispatch updated successfully'));

  } catch (error: any) {
    console.error('Error updating dispatch:', error);
    await logError('dispatch_update', 'dispatch', error.message, request);
    return NextResponse.json(errorResponse('Failed to update dispatch'), { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    // Validate session
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(unauthorizedResponse('Unauthorized'), { status: 401 });
    }

    const { id } = await params;

    // Check if dispatch exists
    const dispatch = await Dispatch.findById(id);
    if (!dispatch) {
      return NextResponse.json(notFoundResponse('Dispatch'), { status: 404 });
    }

    // Delete dispatch
    await Dispatch.findByIdAndDelete(id);

    await logDelete('dispatch', id, { 
      billNo: dispatch.billNo,
      orderId: dispatch.orderId 
    }, request);

    return NextResponse.json(deletedResponse('Dispatch deleted successfully'));

  } catch (error: any) {
    console.error('Error deleting dispatch:', error);
    await logError('dispatch_delete', 'dispatch', error.message, request);
    return NextResponse.json(errorResponse('Failed to delete dispatch'), { status: 500 });
  }
}
