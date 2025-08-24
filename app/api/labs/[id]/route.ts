import { NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Lab } from '@/models';
import { Quality } from '@/models';
import { updateLabSchema } from '@/lib/validation/lab';
import { ok, badRequest, notFound, serverError } from '@/lib/http';
import { isValidObjectId } from '@/lib/ids';
import { logView, logUpdate, logDelete, logError } from '@/lib/logger';

// GET /api/labs/[id] - Get a specific lab
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return badRequest('Invalid lab ID');
    }
    
    // Find lab without populate to avoid the error
    const lab = await Lab.findOne({ 
      _id: id, 
      softDeleted: false 
    });
    
    if (!lab) {
      return notFound('Lab not found');
    }
    
    // Log the lab view
    await logView('lab', id, request);
    
    return ok(lab);
    
  } catch (error) {
    console.error('Error fetching lab:', error);
    await logError('lab_view', 'lab', error instanceof Error ? error.message : 'Unknown error', request);
    return serverError(error);
  }
}

// PUT /api/labs/[id] - Update a lab
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return badRequest('Invalid lab ID');
    }
    
    const body = await request.json();
    
    // Validate request body
    const validationResult = updateLabSchema.safeParse(body);
    if (!validationResult.success) {
      return badRequest(validationResult.error.issues[0].message);  
    }
    
    // Find the lab
    const lab = await Lab.findOne({ 
      _id: id, 
      softDeleted: false 
    });
    
    if (!lab) {
      return notFound('Lab not found');
    }
    
    // Update the lab (excluding order which is immutable)
    const updateData = validationResult.data;
    
    // Remove any attempt to change immutable fields
    delete (updateData as any).order;
    
    // Allow orderItemId updates for order updates
    
    // Store old values for logging
    const oldValues = lab.toObject();
    
    Object.assign(lab, updateData);
    await lab.save();
    
    // Log the lab update
    try {
      await logUpdate('lab', id, oldValues, lab.toObject(), request);
    } catch (logError) {
      // Don't fail the request if logging fails
    }
    
    // Return the updated lab without populate to avoid the error
    return ok(lab);
    
  } catch (error: any) {
    console.error('Error updating lab:', error);
    console.error('Error details:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      name: error?.name
    });
    await logError('lab_update', 'lab', error?.message || 'Unknown error', request);
    return serverError(error);
  }
}

// DELETE /api/labs/[id] - Soft delete a lab
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return badRequest('Invalid lab ID');
    }
    
    // Find and soft delete the lab
    const lab = await Lab.findOne({ 
      _id: id, 
      softDeleted: false 
    });
    
    if (!lab) {
      return notFound('Lab not found');
    }
    
    lab.softDeleted = true;
    await lab.save();
    
    // Log the lab deletion
    await logDelete('lab', id, { softDeleted: true }, request);
    
    return ok({ message: 'Lab deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting lab:', error);
    await logError('lab_delete', 'lab', error instanceof Error ? error.message : 'Unknown error', request);
    return serverError(error);
  }
}
