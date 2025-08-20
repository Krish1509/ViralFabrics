import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ 
        success: false, 
        message: 'No authorization header' 
      });
    }

    const token = authHeader.split(" ")[1];
    const JWT_SECRET = process.env.JWT_SECRET;
    
    if (!token || !JWT_SECRET) {
      return NextResponse.json({ 
        success: false, 
        message: 'No token or JWT_SECRET' 
      });
    }

    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secretKey);
    
    return NextResponse.json({ 
      success: true, 
      payload: payload,
      message: 'Token decoded successfully'
    });
  } catch (error) {
    console.error('Token decode error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Token decode failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
