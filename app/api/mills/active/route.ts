import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Mill } from '@/models';
import { getSession } from '@/lib/session';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Validate session
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(unauthorizedResponse('Unauthorized'), { status: 401 });
    }

    // Get only active mills
    const mills = await Mill.find({ isActive: true })
      .select('name contactPerson contactPhone')
      .sort({ name: 1 })
      .lean();

    return NextResponse.json(successResponse(mills, 'Active mills fetched successfully'));

  } catch (error: any) {
    return NextResponse.json(errorResponse('Failed to fetch active mills'), { status: 500 });
  }
}
