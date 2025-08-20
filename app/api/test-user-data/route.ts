import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        message: 'No session found' 
      });
    }

    await dbConnect();
    
    // Get the user from database
    const user = await User.findById(session.id).select('-password');
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'User not found in database' 
      });
    }

    return NextResponse.json({ 
      success: true, 
      user: user.toObject(),
      session: session,
      message: 'User data retrieved successfully'
    });
  } catch (error) {
    console.error('User data test error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'User data test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
