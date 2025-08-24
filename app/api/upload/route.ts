import { NextRequest } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { Readable } from 'stream';

export async function POST(request: NextRequest) {
  try {
    // Check environment variables first
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('Missing Cloudinary environment variables');
      return new Response(
        JSON.stringify({ 
          message: 'Cloudinary configuration is incomplete. Please check your environment variables.',
          details: {
            cloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
            apiKey: !!process.env.CLOUDINARY_API_KEY,
            apiSecret: !!process.env.CLOUDINARY_API_SECRET,
          }
        }),
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return new Response(
        JSON.stringify({ message: 'No file uploaded' }),
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return new Response(
        JSON.stringify({ message: 'Only image files are allowed' }),
        { status: 400 }
      );
    }

    // Validate file size (max 10MB for Cloudinary)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({ message: 'File size must be less than 10MB' }),
        { status: 400 }
      );
    }

    // Starting Cloudinary upload for file

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a readable stream from buffer
    const stream = Readable.from(buffer);

    // Upload to Cloudinary with minimal configuration
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'crm-orders',
          resource_type: 'image'
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            // Cloudinary upload success
            resolve(result);
          }
        }
      );

      stream.pipe(uploadStream);
    });

    const result = await uploadPromise as any;

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: result.secure_url,
        publicId: result.public_id,
        message: 'Image uploaded successfully to Cloudinary' 
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return new Response(
      JSON.stringify({ 
        message: 'Failed to upload image to Cloudinary',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500 }
    );
  }
}
