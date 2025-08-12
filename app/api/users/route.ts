import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { requireSuperAdmin } from "@/lib/session";
import bcrypt from "bcryptjs";
import { type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Require superadmin access
    await requireSuperAdmin(req);

    await dbConnect();
    const users = await User.find().select("-password"); // exclude password field directly

    // Map user fields to send only needed info (use username, not email)
    const usersSafe = users.map(user => ({
      _id: user._id,
      name: user.name,
      username: user.username,
      phoneNumber: user.phoneNumber,
      address: user.address,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return new Response(JSON.stringify(usersSafe), { status: 200 });
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

export async function POST(req: NextRequest) {
  try {
    // Require superadmin access
    await requireSuperAdmin(req);

    const { name, username, password, role: newUserRole, phoneNumber, address } = await req.json();

    // Validation
    const errors: string[] = [];
    
    if (!name || !name.trim()) {
      errors.push("Name is required");
    }
    
    if (!username || !username.trim()) {
      errors.push("Username is required");
    }
    
    if (!password || password.length < 6) {
      errors.push("Password must be at least 6 characters");
    }
    
    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ message: errors.join(", ") }), 
        { status: 400 }
      );
    }

    await dbConnect();

    const existing = await User.findOne({ username: username.trim() });
    if (existing) {
      return new Response(JSON.stringify({ message: "Username already exists" }), { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = {
      name: name.trim(),
      username: username.trim(),
      password: hashedPassword,
      role: newUserRole === "superadmin" ? "superadmin" : "user",
      phoneNumber: phoneNumber ? phoneNumber.trim() : undefined,
      address: address ? address.trim() : undefined,
    };
    
    const created = await User.create(userData);

    const userSafe = {
      _id: created._id,
      name: created.name,
      username: created.username,
      phoneNumber: created.phoneNumber,
      address: created.address,
      role: created.role,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };

    return new Response(JSON.stringify({ message: "User created", user: userSafe }), { status: 201 });
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
