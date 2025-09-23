import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { MillOutput } from '@/models';
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

    const millOutput = await MillOutput.findById(id)
      .populate('order', 'orderId orderType party')
      .populate('quality', 'name')
      .lean();
    
    if (!millOutput) {
      return NextResponse.json(notFoundResponse('Mill output'), { status: 404 });
    }

    return NextResponse.json(successResponse(millOutput, 'Mill output fetched successfully'));

  } catch (error: any) {
    return NextResponse.json(errorResponse('Failed to fetch mill output'), { status: 500 });
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
    const { recdDate, millBillNo, finishedMtr, millRate, quality } = body;

    // Check if mill output exists
    const existingMillOutput = await MillOutput.findById(id);
    if (!existingMillOutput) {
      return NextResponse.json(notFoundResponse('Mill output'), { status: 404 });
    }

    // Validate required fields
    if (!recdDate) {
      return NextResponse.json(validationErrorResponse('Received date is required'), { status: 400 });
    }
    if (!millBillNo) {
      return NextResponse.json(validationErrorResponse('Mill bill number is required'), { status: 400 });
    }
    if (!finishedMtr || finishedMtr <= 0) {
      return NextResponse.json(validationErrorResponse('Valid finished meters is required'), { status: 400 });
    }
    if (!millRate || millRate <= 0) {
      return NextResponse.json(validationErrorResponse('Valid mill rate is required'), { status: 400 });
    }

    // Update mill output
    const updatedMillOutput = await MillOutput.findByIdAndUpdate(
      id,
      {
        recdDate: new Date(recdDate),
        millBillNo: millBillNo.trim(),
        finishedMtr: parseFloat(finishedMtr),
        millRate: parseFloat(millRate),
        quality: quality || null
      },
      { new: true, runValidators: true }
    );

    if (!updatedMillOutput) {
      return NextResponse.json(notFoundResponse('Mill output'), { status: 404 });
    }

    // Populate references for response
    const populatedMillOutput = await MillOutput.findById(updatedMillOutput._id)
      .populate('order', 'orderId orderType party')
      .populate('quality', 'name')
      .lean();

    await logUpdate('mill_output', id, { 
      oldMillBillNo: existingMillOutput.millBillNo 
    }, { 
      newMillBillNo: updatedMillOutput.millBillNo 
    }, request);

    return NextResponse.json(updatedResponse(populatedMillOutput, 'Mill output updated successfully'));

  } catch (error: any) {
    await logError('mill_output_update', 'mill_output', error.message, request);
    return NextResponse.json(errorResponse('Failed to update mill output'), { status: 500 });
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

    // Check if mill output exists
    const millOutput = await MillOutput.findById(id);
    if (!millOutput) {
      return NextResponse.json(notFoundResponse('Mill output'), { status: 404 });
    }

    // Delete mill output
    await MillOutput.findByIdAndDelete(id);

    await logDelete('mill_output', id, { 
      millBillNo: millOutput.millBillNo,
      orderId: millOutput.orderId 
    }, request);

    return NextResponse.json(deletedResponse('Mill output deleted successfully'));

  } catch (error: any) {
    await logError('mill_output_delete', 'mill_output', error.message, request);
    return NextResponse.json(errorResponse('Failed to delete mill output'), { status: 500 });
  }
}
