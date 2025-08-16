import { NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...');
    
    await dbConnect();
    
    console.log('Database connection successful');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Database connection successful',
        timestamp: new Date().toISOString()
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Database connection error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      { status: 500 }
    );
  }
}
