import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Mill } from '@/models';
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

    const mill = await Mill.findById(id).lean();
    
    if (!mill) {
      return NextResponse.json(notFoundResponse('Mill'), { status: 404 });
    }

    return NextResponse.json(successResponse(mill, 'Mill fetched successfully'));

  } catch (error: any) {
    return NextResponse.json(errorResponse('Failed to fetch mill'), { status: 500 });
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
    const { name, contactPerson, contactPhone, address, email, isActive } = body;

    // Check if mill exists
    const existingMill = await Mill.findById(id);
    if (!existingMill) {
      return NextResponse.json(notFoundResponse('Mill'), { status: 404 });
    }

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return NextResponse.json(validationErrorResponse('Mill name is required'), { status: 400 });
    }

    // Check if another mill with same name already exists
    const duplicateMill = await Mill.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      _id: { $ne: id }
    });
    if (duplicateMill) {
      return NextResponse.json(validationErrorResponse('Mill with this name already exists'), { status: 400 });
    }

    // Update mill
    const updatedMill = await Mill.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        contactPerson: contactPerson?.trim(),
        contactPhone: contactPhone?.trim(),
        address: address?.trim(),
        email: email?.trim(),
        isActive: isActive !== undefined ? isActive : existingMill.isActive
      },
      { new: true, runValidators: true }
    );

    if (!updatedMill) {
      return NextResponse.json(notFoundResponse('Mill'), { status: 404 });
    }

    await logUpdate('mill', id, { oldName: existingMill.name }, { newName: updatedMill.name }, request);

    return NextResponse.json(updatedResponse(updatedMill, 'Mill updated successfully'));

  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(validationErrorResponse('Mill with this name already exists'), { status: 400 });
    }
    
    await logError('mill_update', 'mill', error.message, request);
    return NextResponse.json(errorResponse('Failed to update mill'), { status: 500 });
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

    // Check if mill exists
    const mill = await Mill.findById(id);
    if (!mill) {
      return NextResponse.json(notFoundResponse('Mill'), { status: 404 });
    }

    // Check if mill is being used in any mill inputs
    const { MillInput } = await import('@/models');
    const millInputsCount = await MillInput.countDocuments({ mill: id });
    
    if (millInputsCount > 0) {
      // Delete all mill inputs that use this mill first
      await MillInput.deleteMany({ mill: id });
      }

    // Delete mill
    await Mill.findByIdAndDelete(id);

    await logDelete('mill', id, { millName: mill.name }, request);

    return NextResponse.json(deletedResponse('Mill deleted successfully'));

  } catch (error: any) {
    await logError('mill_delete', 'mill', error.message, request);
    return NextResponse.json(errorResponse('Failed to delete mill'), { status: 500 });
  }
}
