import { NextResponse } from "next/server";
import dbConnectProduction from "@/lib/dbConnectProduction";

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Test database connection
    await dbConnectProduction();
    
    const connectionTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: "healthy",
      database: "connected",
      connectionTime: `${connectionTime}ms`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      status: "unhealthy",
      database: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
