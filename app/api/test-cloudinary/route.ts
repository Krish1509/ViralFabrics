import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Cloudinary configuration...');
    
    // Check environment variables
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    
    console.log('Cloudinary config check:', {
      cloudName: !!cloudName,
      apiKey: !!apiKey,
      apiSecret: !!apiSecret
    });
    
    if (!cloudName || !apiKey || !apiSecret) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Cloudinary configuration is incomplete',
          details: {
            cloudName: !!cloudName,
            apiKey: !!apiKey,
            apiSecret: !!apiSecret
          },
          timestamp: new Date().toISOString()
        }),
        { status: 500 }
      );
    }
    
    console.log('Cloudinary configuration is complete');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Cloudinary configuration is complete',
        details: {
          cloudName: cloudName,
          apiKey: apiKey ? '***' + apiKey.slice(-4) : 'missing',
          apiSecret: apiSecret ? '***' + apiSecret.slice(-4) : 'missing'
        },
        timestamp: new Date().toISOString()
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Cloudinary test error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Cloudinary test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      { status: 500 }
    );
  }
}
