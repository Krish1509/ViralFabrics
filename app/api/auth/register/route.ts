import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { type NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { name, username, password } = await req.json();

    await dbConnect();

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return new Response(JSON.stringify({ message: "User already exists" }), { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Always set role to "user" at signup for security
    const newUser = await User.create({
      name,
      username,
      password: hashedPassword,
      role: "user"
    });

    return new Response(JSON.stringify({ message: "User registered", user: newUser }), { status: 201 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ message }), { status: 500 });
  }
}
