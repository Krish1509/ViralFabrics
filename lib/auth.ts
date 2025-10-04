import { jwtVerify } from "jose";

export interface TokenPayload {
  id: string;
  username: string;
  role: string;
  name?: string;
  phoneNumber?: string;
  address?: string;
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    
    if (!JWT_SECRET) {
      return null;
    }

    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secretKey);
    
    if (!payload || typeof payload !== "object") {
      return null;
    }

    return {
      id: (payload as Record<string, unknown>).id as string,
      username: (payload as Record<string, unknown>).username as string,
      role: (payload as Record<string, unknown>).role as string,
      name: (payload as Record<string, unknown>).name as string | undefined,
      phoneNumber: (payload as Record<string, unknown>).phoneNumber as string | undefined,
      address: (payload as Record<string, unknown>).address as string | undefined,
    };
  } catch (error) {
    return null;
  }
}
