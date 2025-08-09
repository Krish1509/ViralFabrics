import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { type NextRequest } from "next/server";

async function requireAuth(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return { status: 401 as const, error: new Response("No token", { status: 401 }) };
  const token = authHeader.split(" ")[1];
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!token) return { status: 401 as const, error: new Response("No token", { status: 401 }) };
  if (!JWT_SECRET) return { status: 500 as const, error: new Response(JSON.stringify({ message: "Server misconfiguration" }), { status: 500 }) };
  const secretKey = new TextEncoder().encode(JWT_SECRET);
  const { payload } = await jwtVerify(token, secretKey);
  const id = typeof payload === "object" && payload !== null ? (payload as any).id : undefined;
  if (!id) return { status: 401 as const, error: new Response("Invalid token", { status: 401 }) };
  return { status: 200 as const, id };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.status !== 200) return auth.error;
    await dbConnect();
    const me = await User.findById(auth.id).select("-password");
    if (!me) return new Response("Not found", { status: 404 });
    return new Response(JSON.stringify(me), { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ message }), { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.status !== 200) return auth.error;

    const { name, username, password } = await req.json();
    const update: Record<string, unknown> = {};
    if (typeof name === "string" && name.trim()) update.name = name;
    if (typeof username === "string" && username.trim()) update.username = username;
    if (typeof password === "string" && password.length > 0) {
      update.password = await bcrypt.hash(password, 10);
    }

    await dbConnect();
    const updated = await User.findByIdAndUpdate(auth.id, update, { new: true }).select("-password");
    if (!updated) return new Response("Not found", { status: 404 });
    return new Response(JSON.stringify({ message: "Profile updated", user: updated }), { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ message }), { status: 500 });
  }
}


