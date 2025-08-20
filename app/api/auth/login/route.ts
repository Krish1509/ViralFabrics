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
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ message: "Username and password are required" }, { status: 400 });
    }
    const user = await User.findOne({ $or: [{ username }, { name: username }] }).select('+password');
    if (!user) {
      await logLogin(username, false, req as any, 'User not found');
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await logLogin(username, false, req as any, 'Invalid password');
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error("JWT_SECRET is not configured");
      return NextResponse.json({ message: "Server misconfiguration" }, { status: 500 });
    }

    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const token = await new SignJWT({ 
      id: user._id.toString(), 
      role: user.role,
      username: user.username || user.name,
      name: user.name
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
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
