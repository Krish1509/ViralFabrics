import { NextRequest } from 'next/server';
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const { action, username, newPassword } = await request.json();
    
    if (action === 'fix-user') {
      // Fix a specific user's password
      if (!username || !newPassword) {
        return new Response(JSON.stringify({
          success: false,
          message: 'Username and newPassword are required'
        }), { status: 400 });
      }
      
      const user = await User.findOne({ username: username.trim() });
      if (!user) {
        return new Response(JSON.stringify({
          success: false,
          message: `User with username '${username}' not found`
        }), { status: 404 });
      }
      
      // Hash the new password properly
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      // Update the user's password
      user.password = hashedPassword;
      await user.save();
      
      return new Response(JSON.stringify({
        success: true,
        message: `Password updated for user '${username}'`,
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          role: user.role
        }
      }), { status: 200 });
      
    } else if (action === 'list-users') {
      // List all users with their password status
      const users = await User.find().select('_id name username role password createdAt').lean();
      
      const usersWithStatus = users.map(user => ({
        _id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
        passwordStatus: user.password ? 'Has Password' : 'No Password',
        passwordLength: user.password ? user.password.length : 0
      }));
      
      return new Response(JSON.stringify({
        success: true,
        count: usersWithStatus.length,
        users: usersWithStatus
      }), { status: 200 });
      
    } else if (action === 'test-login') {
      // Test login for a specific user
      if (!username || !newPassword) {
        return new Response(JSON.stringify({
          success: false,
          message: 'Username and password are required for login test'
        }), { status: 400 });
      }
      
      const user = await User.findOne({ username: username.trim() }).select('+password');
      if (!user) {
        return new Response(JSON.stringify({
          success: false,
          message: `User with username '${username}' not found`
        }), { status: 404 });
      }
      
      // Test password match
      const isMatch = await bcrypt.compare(newPassword, user.password);
      
      return new Response(JSON.stringify({
        success: true,
        loginTest: {
          username: user.username,
          passwordMatch: isMatch,
          userExists: true,
          passwordLength: user.password.length
        }
      }), { status: 200 });
      
    } else {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid action. Use: fix-user, list-users, or test-login'
      }), { status: 400 });
    }
    
  } catch (error) {
    console.error('Debug fix passwords error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Internal server error'
    }), { status: 500 });
  }
}
