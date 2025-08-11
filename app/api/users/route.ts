import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Temporarily disable auth for debugging
    /*
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return new Response("No token", { status: 401 });

    const token = authHeader.split(" ")[1];
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!token) return new Response("No token", { status: 401 });
    if (!JWT_SECRET) {
      return new Response(JSON.stringify({ message: "Server misconfiguration" }), { status: 500 });
    }

    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secretKey);
    const role = typeof payload === "object" && payload !== null ? (payload as any).role : undefined;
    if (role !== "superadmin") {
      return new Response("Forbidden", { status: 403 });
    }
    */

    await dbConnect();
    const users = await User.find().select("-password"); // exclude password field directly

    console.log('Retrieved users from DB:', users); // Debug log

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

    console.log('Sending users to frontend:', usersSafe); // Debug log

    return new Response(JSON.stringify(usersSafe), { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ message }), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Temporarily disable auth for debugging
    /*
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return new Response("No token", { status: 401 });

    const token = authHeader.split(" ")[1];
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!token) return new Response("No token", { status: 401 });
    if (!JWT_SECRET) {
      return new Response(JSON.stringify({ message: "Server misconfiguration" }), { status: 500 });
    }

    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secretKey);
    const role = typeof payload === "object" && payload !== null ? (payload as any).role : undefined;
    if (role !== "superadmin") {
      return new Response("Forbidden", { status: 403 });
    }
    */

    const { name, username, password, role: newUserRole, phoneNumber, address } = await req.json();

    console.log('API received data:', { name, username, password, role: newUserRole, phoneNumber, address }); // Debug log
    console.log('Phone number type:', typeof phoneNumber, 'Value:', phoneNumber); // Debug log
    console.log('Address type:', typeof address, 'Value:', address); // Debug log

    if (!username || !password) {
      return new Response(JSON.stringify({ message: "username and password are required" }), { status: 400 });
    }

    await dbConnect();

    const existing = await User.findOne({ username });
    if (existing) {
      return new Response(JSON.stringify({ message: "User already exists" }), { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = {
      name: name ?? username,
      username,
      password: hashedPassword,
      role: newUserRole === "superadmin" ? "superadmin" : "user",
      phoneNumber: phoneNumber || undefined,
      address: address || undefined,
    };
    
    console.log('Creating user with data:', userData); // Debug log
    console.log('UserData phoneNumber:', userData.phoneNumber); // Debug log
    console.log('UserData address:', userData.address); // Debug log
    
    const created = await User.create(userData);
    console.log('User created in DB:', created); // Debug log
    console.log('Created user phoneNumber:', created.phoneNumber); // Debug log
    console.log('Created user address:', created.address); // Debug log

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
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ message }), { status: 500 });
  }
}
