import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { MillInput } from '@/models';
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

    const millInput = await MillInput.findById(id)
      .populate('mill', 'name contactPerson contactPhone')
      .populate('order', 'orderId orderType party')
      .lean();
    
    if (!millInput) {
      return NextResponse.json(notFoundResponse('Mill input'), { status: 404 });
    }

    return NextResponse.json(successResponse(millInput, 'Mill input fetched successfully'));

  } catch (error: any) {
    return NextResponse.json(errorResponse('Failed to fetch mill input'), { status: 500 });
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
    const { mill, millDate, chalanNo, greighMtr, pcs, notes } = body;

    // Check if mill input exists
    const existingMillInput = await MillInput.findById(id);
    if (!existingMillInput) {
      return NextResponse.json(notFoundResponse('Mill input'), { status: 404 });
    }

    // Validate required fields
    if (!mill) {
      return NextResponse.json(validationErrorResponse('Mill is required'), { status: 400 });
    }
    if (!millDate) {
      return NextResponse.json(validationErrorResponse('Mill date is required'), { status: 400 });
    }
    if (!chalanNo) {
      return NextResponse.json(validationErrorResponse('Chalan number is required'), { status: 400 });
    }
    if (!greighMtr || greighMtr <= 0) {
      return NextResponse.json(validationErrorResponse('Valid greigh meters is required'), { status: 400 });
    }
    if (!pcs || pcs <= 0) {
      return NextResponse.json(validationErrorResponse('Valid number of pieces is required'), { status: 400 });
    }

    // Check if mill exists
    const { Mill } = await import('@/models');
    const millExists = await Mill.findById(mill);
    if (!millExists) {
      return NextResponse.json(notFoundResponse('Mill'), { status: 404 });
    }

    // Check if chalan number already exists for this order (excluding current record)
    const existingChalan = await MillInput.findOne({ 
      orderId: existingMillInput.orderId,
      chalanNo: chalanNo.trim(),
      _id: { $ne: id }
    });
    if (existingChalan) {
      return NextResponse.json(validationErrorResponse('Chalan number already exists for this order'), { status: 400 });
    }

    // Update mill input
    const updatedMillInput = await MillInput.findByIdAndUpdate(
      id,
      {
        mill,
        millDate: new Date(millDate),
        chalanNo: chalanNo.trim(),
        greighMtr: parseFloat(greighMtr),
        pcs: parseInt(pcs),
        notes: notes?.trim()
      },
      { new: true, runValidators: true }
    );

    if (!updatedMillInput) {
      return NextResponse.json(notFoundResponse('Mill input'), { status: 404 });
    }

    // Populate references for response
    const populatedMillInput = await MillInput.findById(updatedMillInput._id)
      .populate('mill', 'name contactPerson contactPhone')
      .populate('order', 'orderId orderType party')
      .lean();

    await logUpdate('mill_input', id, { 
      oldChalanNo: existingMillInput.chalanNo 
    }, { 
      newChalanNo: updatedMillInput.chalanNo 
    }, request);

    return NextResponse.json(updatedResponse(populatedMillInput, 'Mill input updated successfully'));

  } catch (error: any) {
    await logError('mill_input_update', 'mill_input', error.message, request);
    return NextResponse.json(errorResponse('Failed to update mill input'), { status: 500 });
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

    // Check if mill input exists
    const millInput = await MillInput.findById(id);
    if (!millInput) {
      return NextResponse.json(notFoundResponse('Mill input'), { status: 404 });
    }

    // Delete mill input
    await MillInput.findByIdAndDelete(id);

    await logDelete('mill_input', id, { 
      chalanNo: millInput.chalanNo,
      orderId: millInput.orderId 
    }, request);

    return NextResponse.json(deletedResponse('Mill input deleted successfully'));

  } catch (error: any) {
    await logError('mill_input_delete', 'mill_input', error.message, request);
    return NextResponse.json(errorResponse('Failed to delete mill input'), { status: 500 });
  }
}
