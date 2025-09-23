import { NextRequest } from 'next/server';
import { verifyToken, TokenPayload } from '@/lib/auth';
import { unauthorized } from '@/lib/http';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{}> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized('No token provided');
    }

    const token = authHeader.substring(7);
    
    // Verify the token with timeout
    const decoded = await Promise.race([
      verifyToken(token),
      new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Token verification timeout')), 500)
      )
    ]) as TokenPayload | null;
    
    if (!decoded) {
      return unauthorized('Invalid token');
    }

    // Return minimal user info for session validation
    return new Response(JSON.stringify({
      success: true,
      user: {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role
      }
    }), { 
      status: 200, 
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
      }
    });

  } catch (error) {
    return unauthorized('Session validation failed');
  }
}
