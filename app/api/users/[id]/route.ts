import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { requireSuperAdmin } from "@/lib/session";
import bcrypt from "bcryptjs";
import { type NextRequest } from "next/server";
import { logUpdate, logDelete } from "@/lib/logger";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require superadmin access
    const session = await requireSuperAdmin(req);
    await dbConnect();
    const { id } = await params;
    
    // Validate ID
    if (!id || id === 'undefined' || id === 'null') {
      return new Response(
        JSON.stringify({ 
          message: "Invalid user ID provided" 
        }), 
        { status: 400 }
      );
    }
    
    const user = await User.findById(id).select("-password");
    if (!user) return new Response("Not found", { status: 404 });
    return new Response(JSON.stringify(user), { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return new Response(JSON.stringify({ message: "Access denied - Superadmin access required" }), { status: 403 });
      }
    }
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ message }), { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require superadmin access
    const session = await requireSuperAdmin(req);

    const { name, username, password, role, phoneNumber, address } = await req.json();
    
    // Validation
    const errors: string[] = [];
    
    if (typeof name === "string" && !name.trim()) {
      errors.push("Name is required");
    }
    
    if (typeof username === "string" && !username.trim()) {
      errors.push("Username is required");
    }
    
    if (typeof password === "string" && password.length > 0 && password.length < 6) {
      errors.push("Password must be at least 6 characters");
    }
    
    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ message: errors.join(", ") }), 
        { status: 400 }
      );
    }

    await dbConnect();
    const { id } = await params;
    
    // Validate ID
    if (!id || id === 'undefined' || id === 'null') {
      return new Response(
        JSON.stringify({ 
          message: "Invalid user ID provided" 
        }), 
        { status: 400 }
      );
    }
    
    // Check if username already exists (excluding current user)
    if (typeof username === "string" && username.trim()) {
      const existingUser = await User.findOne({ 
        username: username.trim(), 
        _id: { $ne: id } 
      });
      
      if (existingUser) {
        return new Response(
          JSON.stringify({ message: "Username already exists" }), 
          { status: 400 }
        );
      }
    }
    
    const update: Record<string, unknown> = {};
    if (typeof name === "string" && name.trim()) update.name = name.trim();
    if (typeof username === "string" && username.trim()) update.username = username.trim();
    if (role === "user" || role === "superadmin") update.role = role;
    if (typeof phoneNumber === "string") update.phoneNumber = phoneNumber.trim();
    if (typeof address === "string") update.address = address.trim();
    if (typeof password === "string" && password.length > 0) {
      update.password = await bcrypt.hash(password, 10);
    }

    const updated = await User.findByIdAndUpdate(id, update, { new: true })
      .select("-password");
    if (!updated) return new Response("Not found", { status: 404 });
    
    // Log the user update
    await logUpdate('user', id, update, updated.toObject(), req);
    
    return new Response(JSON.stringify({ message: "User updated", user: updated }), { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return new Response(JSON.stringify({ message: "Access denied - Superadmin access required" }), { status: 403 });
      }
      // Handle MongoDB duplicate key errors
      if (error.message.includes('E11000')) {
        if (error.message.includes('username')) {
          return new Response(
            JSON.stringify({ message: "Username already exists" }), 
            { status: 400 }
          );
        }
      }
    }
    
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ message }), { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require superadmin access
    const session = await requireSuperAdmin(req);
    
    const { id } = await params;
    
    // Validate ID
    if (!id || id === 'undefined' || id === 'null') {
      return new Response(
        JSON.stringify({ 
          message: "Invalid user ID provided" 
        }), 
        { status: 400 }
      );
    }
    
    // Prevent self-deletion
    if (session.id === id) {
      return new Response(
        JSON.stringify({ 
          message: "Cannot delete your own account. This would lock you out of the system." 
        }), 
        { status: 400 }
      );
    }
    
    await dbConnect();
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return new Response("Not found", { status: 404 });
    
    // Log the user deletion
    await logDelete('user', id, { username: deleted.username, role: deleted.role }, req);
    
    return new Response(JSON.stringify({ message: "User deleted" }), { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return new Response(JSON.stringify({ message: "Access denied - Superadmin access required" }), { status: 403 });
      }
    }
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ message }), { status: 500 });
  }
}


