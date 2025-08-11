import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { type NextRequest } from "next/server";

async function requireSuperadmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return { status: 401 as const, error: new Response("No token", { status: 401 }) };
  const token = authHeader.split(" ")[1];
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!token) return { status: 401 as const, error: new Response("No token", { status: 401 }) };
  if (!JWT_SECRET) return { status: 500 as const, error: new Response(JSON.stringify({ message: "Server misconfiguration" }), { status: 500 }) };
  const secretKey = new TextEncoder().encode(JWT_SECRET);
  const { payload } = await jwtVerify(token, secretKey);
  const role = typeof payload === "object" && payload !== null ? (payload as any).role : undefined;
  if (role !== "superadmin") return { status: 403 as const, error: new Response("Forbidden", { status: 403 }) };
  return { status: 200 as const };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSuperadmin(req);
    if (auth.status !== 200) return auth.error;
    await dbConnect();
    const { id } = await params;
    const user = await User.findById(id).select("-password");
    if (!user) return new Response("Not found", { status: 404 });
    return new Response(JSON.stringify(user), { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ message }), { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSuperadmin(req);
    if (auth.status !== 200) return auth.error;

    const { name, username, password, role, phoneNumber, address } = await req.json();
    const update: Record<string, unknown> = {};
    if (typeof name === "string" && name.trim()) update.name = name;
    if (typeof username === "string" && username.trim()) update.username = username;
    if (role === "user" || role === "superadmin") update.role = role;
    if (typeof phoneNumber === "string") update.phoneNumber = phoneNumber;
    if (typeof address === "string") update.address = address;
    if (typeof password === "string" && password.length > 0) {
      update.password = await bcrypt.hash(password, 10);
    }

    await dbConnect();
    const { id } = await params;
    const updated = await User.findByIdAndUpdate(id, update, { new: true })
      .select("-password");
    if (!updated) return new Response("Not found", { status: 404 });
    return new Response(JSON.stringify({ message: "User updated", user: updated }), { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ message }), { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSuperadmin(req);
    if (auth.status !== 200) return auth.error;
    await dbConnect();
    const { id } = await params;
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return new Response("Not found", { status: 404 });
    return new Response(JSON.stringify({ message: "User deleted" }), { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ message }), { status: 500 });
  }
}


