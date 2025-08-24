import { NextRequest } from 'next/server';
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    
    if (username) {
      // Find specific user
      const user = await User.findOne({ username: username.trim() }).select('-password');
      if (!user) {
        return new Response(JSON.stringify({
          success: false,
          message: `User with username '${username}' not found`
        }), { status: 404 });
      }
      
      return new Response(JSON.stringify({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          role: user.role,
          isActive: user.isActive,
          accountLocked: user.accountLocked,
          lockExpiresAt: user.lockExpiresAt,
          loginCount: user.loginCount,
          failedLoginAttempts: user.failedLoginAttempts,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        }
      }), { status: 200 });
    } else {
      // List all users (without passwords)
      const users = await User.find().select('-password').sort({ createdAt: -1 });
      
      const usersSafe = users.map(user => ({
        _id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        accountLocked: user.accountLocked,
        loginCount: user.loginCount,
        failedLoginAttempts: user.failedLoginAttempts,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }));
      
      return new Response(JSON.stringify({
        success: true,
        count: usersSafe.length,
        users: usersSafe
      }), { status: 200 });
    }
  } catch (error) {
    console.error('Debug users error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Internal server error'
    }), { status: 500 });
  }
}
