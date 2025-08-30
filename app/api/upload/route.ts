import { NextRequest } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'general';

    if (!file) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No file provided'
      }), { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Only image files are allowed'
      }), { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({
        success: false,
        message: 'File size must be less than 10MB'
      }), { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' }, // Resize if too large
            { quality: 'auto', fetch_format: 'auto' } // Optimize
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

    return new Response(JSON.stringify({
      success: true,
      url: (result as any).secure_url,
      public_id: (result as any).public_id
    }), { status: 200 });

  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to upload file'
    }), { status: 500 });
  }
}
