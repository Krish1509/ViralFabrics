import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        message: 'No session found',
        headers: Object.fromEntries(request.headers.entries())
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      session: session,
      message: 'Session found successfully'
    });
  } catch (error) {
    console.error('Session test error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Session test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
