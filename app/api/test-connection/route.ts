import { NextResponse } from "next/server";

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Simple connection test
    const mongoose = require('mongoose');
    
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      return NextResponse.json({ error: 'MONGODB_URI not set' }, { status: 500 });
    }
    
    // Minimal connection options
    const opts = {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      maxPoolSize: 1,
      family: 4,
    };
    
    await mongoose.connect(MONGODB_URI, opts);
    
    const connectionTime = Date.now() - startTime;
    
    // Test basic operation
    const db = mongoose.connection.db;
    const userCount = await db.collection('users').countDocuments();
    
    await mongoose.disconnect();
    
    return NextResponse.json({
      status: 'success',
      connectionTime: `${connectionTime}ms`,
      userCount: userCount,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
