import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!JWT_SECRET) {
    return NextResponse.json({ message: "Server misconfiguration" }, { status: 500 });
  }

  try {
    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secretKey);

    const role = typeof payload === "object" && payload !== null ? (payload as any).role : undefined;
    if (role !== "superadmin") {
      return NextResponse.json({ message: "Access denied - Superadmin access required" }, { status: 403 });
    }

    return NextResponse.next();
  } catch (error) {
    return NextResponse.json({ message: "Invalid token" }, { status: 403 });
  }
}

export const config = {
  matcher: ["/api/users/:path*"], // protect users API
};
