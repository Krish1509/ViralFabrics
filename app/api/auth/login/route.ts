import { NextResponse } from "next/server"; 
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Log, { ILogModel } from "@/models/Log";
import { logLogin } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { username, password, rememberMe } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ message: "Username and password are required" }, { status: 400 });
    }
    // First try to find by username (exact match)
    let user = await User.findOne({ username: username.trim() }).select('+password');
    
    // If not found by username, try by name (for backward compatibility)
    if (!user) {
      user = await User.findOne({ name: username.trim() }).select('+password');
    }
    
    if (!user) {
      await logLogin(username, false, req as any, 'User not found');
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // Check if account is locked
    if (user.accountLocked && user.lockExpiresAt && user.lockExpiresAt > new Date()) {
      await logLogin(username, false, req as any, 'Account locked');
      return NextResponse.json({ message: "Account is temporarily locked due to too many failed attempts" }, { status: 423 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Record failed login attempt
      try {
        await user.recordFailedLogin();
      } catch (error) {
        console.error('Error recording failed login:', error);
      }
      
      await logLogin(username, false, req as any, 'Invalid password');
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // Reset failed login attempts on successful login
    try {
      await user.incrementLoginCount();
    } catch (error) {
      console.error('Error updating login count:', error);
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error("JWT_SECRET is not configured");
      return NextResponse.json({ message: "Server misconfiguration" }, { status: 500 });
    }

    const secretKey = new TextEncoder().encode(JWT_SECRET);
    
    // Set expiration time based on rememberMe option
    const expirationTime = rememberMe ? "30d" : "7d";
    
    const token = await new SignJWT({ 
      id: user._id.toString(), 
      role: user.role,
      username: user.username || user.name,
      name: user.name
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(expirationTime)
      .sign(secretKey);

    // Prepare user object without password
    const userSafe = {
      _id: user._id,
      name: user.name,
      username: user.username,
      phoneNumber: user.phoneNumber,
      address: user.address,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    // Log successful login with user info
    try {
      await (Log as ILogModel).logUserAction({
        userId: user._id.toString(),
        username: user.username || user.name,
        userRole: user.role,
        action: 'login',
        resource: 'auth',
        details: {
          username: user.username || user.name,
          userId: user._id.toString()
        },
        success: true,
        severity: 'info',
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown'
      });
    } catch (error) {
      console.error('Error logging successful login:', error);
    }
    
    return NextResponse.json({ token, user: userSafe }, { status: 200 });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
