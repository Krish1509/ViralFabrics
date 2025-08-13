import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/session';
import cloudinary from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth(request);

    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No image file provided'
        }),
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'File must be an image'
        }),
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'File size must be less than 5MB'
        }),
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'crm-orders',
          resource_type: 'image',
          transformation: [
            { width: 800, height: 600, crop: 'limit' },
            { quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(buffer);
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          url: (result as any).secure_url,
          public_id: (result as any).public_id,
          width: (result as any).width,
          height: (result as any).height
        }
      }),
      { status: 200 }
    );

  } catch (error: unknown) {
    console.error('Upload error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Unauthorized"
          }),
          { status: 401 }
        );
      }
      
      // Handle Cloudinary specific errors
      if (error.message.includes("Invalid cloud_name")) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Cloudinary configuration error. Please check your environment variables."
          }),
          { status: 500 }
        );
      }
      
      if (error.message.includes("Invalid API key")) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Invalid Cloudinary API key. Please check your credentials."
          }),
          { status: 500 }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to upload image'
      }),
      { status: 500 }
    );
  }
}
