import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { sendSuccess, sendServerError } from '@/lib/response';

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Check database connection
    let dbStatus = 'disconnected';
    let dbLatency = 0;
    
    try {
      const dbStartTime = Date.now();
      if (mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
      }
      dbLatency = Date.now() - dbStartTime;
      dbStatus = 'connected';
    } catch (dbError) {
      dbStatus = 'error';
      console.error('Database health check failed:', dbError);
    }

    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const memoryStatus = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memoryUsage.external / 1024 / 1024) // MB
    };

    // Check environment
    const environment = {
      nodeEnv: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    };

    // Calculate response time
    const responseTime = Date.now() - startTime;

    const healthData = {
      status: dbStatus === 'connected' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      responseTime: `${responseTime}ms`,
      database: {
        status: dbStatus,
        latency: `${dbLatency}ms`,
        connectionString: process.env.MONGODB_URI ? 'configured' : 'missing'
      },
      memory: memoryStatus,
      environment,
      version: process.env.npm_package_version || '1.0.0'
    };

    const statusCode = dbStatus === 'connected' ? 200 : 503;
    
    return NextResponse.json({
      success: true,
      data: healthData,
      message: dbStatus === 'connected' ? 'Service is healthy' : 'Service is unhealthy',
      timestamp: new Date().toISOString()
    }, { status: statusCode });

  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      success: false,
      message: 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
