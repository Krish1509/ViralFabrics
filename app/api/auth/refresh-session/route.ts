import { NextRequest } from 'next/server';
import { verifyToken, TokenPayload } from '@/lib/auth';
import { SignJWT } from "jose";
import { unauthorized } from '@/lib/http';
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized('No token provided');
    }

    const token = authHeader.substring(7);
    
    // Verify the current token
    const decoded = await verifyToken(token) as TokenPayload;
    
    if (!decoded) {
      return unauthorized('Invalid token');
    }

    // Get the user to ensure they still exist
    const user = await User.findById(decoded.id).select('_id username name role');
    if (!user) {
      return unauthorized('User not found');
    }

    // Create a new token with extended expiration
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error("JWT_SECRET is not configured");
      return new Response(JSON.stringify({ message: "Server misconfiguration" }), { status: 500 });
    }

    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const newToken = await new SignJWT({ 
      id: user._id.toString(), 
      role: user.role,
      username: user.username || user.name,
      name: user.name
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d") // Extend for another 7 days
      .sign(secretKey);

    // Return the new token
    return new Response(JSON.stringify({
      success: true,
      token: newToken,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        role: user.role
      }
    }), { 
      status: 200, 
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Session refresh error:', error);
    return unauthorized('Session refresh failed');
  }
}
