import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
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

    await dbConnect();
    const users = await User.find().select("-password"); // exclude password field directly

    // Map user fields to send only needed info (use username, not email)
    const usersSafe = users.map(user => ({
      _id: user._id,
      name: user.name,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return new Response(JSON.stringify(usersSafe), { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ message }), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
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

    const { name, username, password, role: newUserRole } = await req.json();

    if (!username || !password) {
      return new Response(JSON.stringify({ message: "username and password are required" }), { status: 400 });
    }

    await dbConnect();

    const existing = await User.findOne({ username });
    if (existing) {
      return new Response(JSON.stringify({ message: "User already exists" }), { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const created = await User.create({
      name: name ?? username,
      username,
      password: hashedPassword,
      role: newUserRole === "superadmin" ? "superadmin" : "user",
    });

    const userSafe = {
      _id: created._id,
      name: created.name,
      username: created.username,
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
