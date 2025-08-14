import { NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Lab from '@/models/Lab';
import { updateLabSchema } from '@/lib/validation/lab';
import { ok, badRequest, notFound, serverError } from '@/lib/http';
import { isValidObjectId } from '@/lib/ids';

// GET /api/labs/[id] - Get a specific lab
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const { id } = params;
    
    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return badRequest('Invalid lab ID');
    }
    
    // Find lab with order details
    const lab = await Lab.findOne({ 
      _id: id, 
      softDeleted: false 
    }).populate('order');
    
    if (!lab) {
      return notFound('Lab not found');
    }
    
    return ok(lab);
    
  } catch (error) {
    console.error('Error fetching lab:', error);
    return serverError(error);
  }
}

// PUT /api/labs/[id] - Update a lab
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const { id } = params;
    
    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return badRequest('Invalid lab ID');
    }
    
    const body = await request.json();
    
    // Validate request body
    const validationResult = updateLabSchema.safeParse(body);
    if (!validationResult.success) {
      return badRequest(validationResult.error.errors[0].message);
    }
    
    // Find the lab
    const lab = await Lab.findOne({ 
      _id: id, 
      softDeleted: false 
    });
    
    if (!lab) {
      return notFound('Lab not found');
    }
    
    // Update the lab (excluding order and orderItemId which are immutable)
    const updateData = validationResult.data;
    
    // Remove any attempt to change immutable fields
    delete (updateData as any).order;
    delete (updateData as any).orderItemId;
    
    Object.assign(lab, updateData);
    await lab.save();
    
    // Populate order details for response
    await lab.populate('order');
    
    return ok(lab);
    
  } catch (error) {
    console.error('Error updating lab:', error);
    return serverError(error);
  }
}

// DELETE /api/labs/[id] - Soft delete a lab
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const { id } = params;
    
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
    
    return ok({ message: 'Lab deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting lab:', error);
    return serverError(error);
  }
}
