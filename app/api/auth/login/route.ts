import { NextResponse } from "next/server"; 
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Log, { ILogModel } from "@/models/Log";
import { logLogin } from "@/lib/logger";

export async function POST(req: Request) {
  // Set a timeout for the entire login process
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Login timeout')), 25000); // 25 seconds timeout
  });

  try {
    return await Promise.race([
      performLogin(req),
      timeoutPromise
    ]) as NextResponse;
  } catch (error) {
    if (error instanceof Error && error.message === 'Login timeout') {
      return NextResponse.json({ message: "Login is taking longer than expected. Please try again." }, { status: 408 });
    }
    throw error;
  }
}

async function performLogin(req: Request) {
  try {
    // Parse request body first
    const { username, password, rememberMe } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ message: "Username and password are required" }, { status: 400 });
    }

    // Connect to database with retry logic
    let dbConnected = false;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (!dbConnected && retryCount < maxRetries) {
      try {
        await dbConnect();
        dbConnected = true;
      } catch (error) {
        retryCount++;
        if (retryCount >= maxRetries) {
          console.error('Database connection failed after', maxRetries, 'attempts:', error);
          return NextResponse.json({ message: "Database connection failed. Please try again." }, { status: 503 });
        }
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
    
    // Try username first, then name if not found
    let user = await User.findOne({ username: username.trim() }).select('+password');
    if (!user) {
      user = await User.findOne({ name: username.trim() }).select('+password');
    }

    if (!user) {
      // Log in background - don't wait for it
      logLogin(username, false, req as any, 'User not found').catch(() => {});
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // Check if account is locked (non-blocking)
    if (user.accountLocked && user.lockExpiresAt && user.lockExpiresAt > new Date()) {
      logLogin(username, false, req as any, 'Account locked').catch(() => {});
      return NextResponse.json({ message: "Account is temporarily locked due to too many failed attempts" }, { status: 423 });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Record failed login attempt in background - don't wait
      user.recordFailedLogin().catch(() => {});
      logLogin(username, false, req as any, 'Invalid password').catch(() => {});
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // Prepare JWT token and user data in parallel
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return NextResponse.json({ message: "Server misconfiguration" }, { status: 500 });
    }

    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const expirationTime = rememberMe ? "30d" : "7d";
    
    // Create JWT token
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

    // Start all background tasks in parallel - don't wait for any
    Promise.all([
      // Reset failed login attempts
      user.incrementLoginCount ? 
        user.incrementLoginCount() : 
        User.findByIdAndUpdate(user._id, {
          $inc: { loginCount: 1 },
          $set: { 
            lastLogin: new Date(),
            failedLoginAttempts: 0,
            accountLocked: false
          },
          $unset: { lockExpiresAt: 1 }
        }),
      // Log successful login
      (Log as ILogModel).logUserAction({
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
      })
    ]).catch(() => {}); // Silent fail for all background tasks
    
    // Return immediately - don't wait for background tasks
    return NextResponse.json({ token, user: userSafe }, { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: "Login failed" }, { status: 500 });
  }
}
