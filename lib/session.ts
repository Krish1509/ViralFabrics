import { jwtVerify } from "jose";
import { type NextRequest } from "next/server";

export interface SessionUser {
  id: string;
  name: string;
  username: string;
  role: string;
  phoneNumber?: string;
  address?: string;
}

export async function getSession(req: NextRequest): Promise<SessionUser | null> {
  try {
    const authHeader = req.headers.get("authorization");
    console.log('🔍 Session: Auth header present:', !!authHeader);
    if (!authHeader) return null;

    const token = authHeader.split(" ")[1];
    const JWT_SECRET = process.env.JWT_SECRET;
    
    console.log('🔍 Session: Token present:', !!token, 'JWT_SECRET present:', !!JWT_SECRET);
    if (!token || !JWT_SECRET) return null;

    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secretKey);
    
    console.log('Raw JWT payload:', payload);
    
    if (!payload || typeof payload !== "object") return null;

    const sessionUser: SessionUser = {
      id: (payload as any).id,
      name: (payload as any).name,
      username: (payload as any).username,
      role: (payload as any).role,
      phoneNumber: (payload as any).phoneNumber,
      address: (payload as any).address,
    };

    console.log('Session user created:', sessionUser);
    return sessionUser;
  } catch (error) {
    console.error("Session verification error:", error);
    return null;
  }
}

export async function requireAuth(req: NextRequest): Promise<SessionUser> {
  const session = await getSession(req);
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireSuperAdmin(req: NextRequest): Promise<SessionUser> {
  const session = await requireAuth(req);
  if (session.role !== "superadmin") {
    throw new Error("Forbidden - Superadmin access required");
  }
  return session;
}
