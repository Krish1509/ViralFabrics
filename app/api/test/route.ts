import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";

export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      hasMongoUri: !!process.env.MONGODB_URI,
      hasJwtSecret: !!process.env.JWT_SECRET,
      mongoUriLength: process.env.MONGODB_URI?.length || 0,
      jwtSecretLength: process.env.JWT_SECRET?.length || 0,
    };

    // Try database connection
    let dbStatus = "not tested";
    try {
      await dbConnect();
      dbStatus = "connected";
    } catch (dbError) {
      dbStatus = `error: ${dbError instanceof Error ? dbError.message : 'unknown error'}`;
    }

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      envCheck,
      dbStatus,
    });
  } catch (error) {
    return NextResponse.json({
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
