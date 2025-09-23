import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Lab } from '@/models';
import { getSession } from '@/lib/session';
import { successResponse, errorResponse, validationErrorResponse, unauthorizedResponse, notFoundResponse, updatedResponse, deletedResponse } from '@/lib/response';
import { logView, logUpdate, logDelete, logError } from '@/lib/logger';

// GET /api/labs/[id] - Get a specific lab
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
    
    // Validate ObjectId
    if (!id || id.length !== 24) {
      return NextResponse.json(validationErrorResponse('Invalid lab ID'), { status: 400 });
    }
    
    // Find lab without populate to avoid the error
    const lab = await Lab.findOne({ 
      _id: id, 
      softDeleted: false 
    });
    
    if (!lab) {
      return NextResponse.json(notFoundResponse('Lab'), { status: 404 });
    }
    
    // Log the lab view
    await logView('lab', id, request);
    
    return NextResponse.json(successResponse(lab, 'Lab fetched successfully'));
    
  } catch (error: any) {
    await logError('lab_view', 'lab', error.message || 'Unknown error', request);
    return NextResponse.json(errorResponse('Failed to fetch lab'), { status: 500 });
  }
}

// PUT /api/labs/[id] - Update a lab
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
    
    // Validate ObjectId
    if (!id || id.length !== 24) {
      return NextResponse.json(validationErrorResponse('Invalid lab ID'), { status: 400 });
    }
    
    const body = await request.json();
    
    // Basic validation
    const { labSendDate, labSendNumber, labSendData, status, remarks } = body;
    
    if (!labSendDate) {
      return NextResponse.json(validationErrorResponse('Lab send date is required'), { status: 400 });
    }
    
    // Find the lab
    const lab = await Lab.findOne({ 
      _id: id, 
      softDeleted: false 
    });
    
    if (!lab) {
      return NextResponse.json(notFoundResponse('Lab'), { status: 404 });
    }
    
    // Store old values for logging
    const oldValues = lab.toObject();
    
    // Update the lab
    lab.labSendDate = new Date(labSendDate);
    lab.labSendNumber = labSendNumber?.trim();
    lab.labSendData = labSendData || lab.labSendData || {};
    lab.status = status || lab.status;
    lab.remarks = remarks?.trim();
    
    await lab.save();
    
    // Log the lab update
    try {
      await logUpdate('lab', id, oldValues, lab.toObject(), request);
    } catch (logError) {
      // Don't fail the request if logging fails
    }
    
    return NextResponse.json(updatedResponse(lab, 'Lab updated successfully'));
    
  } catch (error: any) {
    await logError('lab_update', 'lab', error.message || 'Unknown error', request);
    return NextResponse.json(errorResponse('Failed to update lab'), { status: 500 });
  }
}

// DELETE /api/labs/[id] - Soft delete a lab
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
    
    // Validate ObjectId
    if (!id || id.length !== 24) {
      return NextResponse.json(validationErrorResponse('Invalid lab ID'), { status: 400 });
    }
    
    // Find and soft delete the lab
    const lab = await Lab.findOne({ 
      _id: id, 
      softDeleted: false 
    });
    
    if (!lab) {
      return NextResponse.json(notFoundResponse('Lab'), { status: 404 });
    }
    
    lab.softDeleted = true;
    await lab.save();
    
    // Log the lab deletion
    await logDelete('lab', id, { softDeleted: true }, request);
    
    return NextResponse.json(deletedResponse('Lab deleted successfully'));
    
  } catch (error: any) {
    await logError('lab_delete', 'lab', error.message || 'Unknown error', request);
    return NextResponse.json(errorResponse('Failed to delete lab'), { status: 500 });
  }
}
