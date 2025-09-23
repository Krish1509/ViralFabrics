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
      id: (payload as any).id,
      username: (payload as any).username,
      role: (payload as any).role,
      name: (payload as any).name,
      phoneNumber: (payload as any).phoneNumber,
      address: (payload as any).address,
    };
  } catch (error) {
    return null;
  }
}
