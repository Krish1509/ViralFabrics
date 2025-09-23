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
    // Check for authentication token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Authentication required'
      }), { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Authentication token required'
      }), { status: 401 });
    }
    
    // Set a longer timeout for file uploads
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for uploads
    
    try {
      // Check content type
      const contentType = req.headers.get('content-type');
      if (!contentType || !contentType.includes('multipart/form-data')) {
        clearTimeout(timeoutId);
        return new Response(JSON.stringify({
          success: false,
          message: 'Invalid content type. Expected multipart/form-data'
        }), { status: 400 });
      }
      
      const formData = await req.formData();
      // Check for both 'file' and 'image' keys for compatibility
      const file = (formData.get('file') || formData.get('image')) as File;
      const folder = formData.get('folder') as string || 'general';
      
      if (!file) {
        clearTimeout(timeoutId);
        return new Response(JSON.stringify({
          success: false,
          message: 'No file provided'
        }), { status: 400 });
      }
      
      if (file.size === 0) {
        clearTimeout(timeoutId);
        return new Response(JSON.stringify({
          success: false,
          message: 'Empty file provided'
        }), { status: 400 });
      }

      // Validate file type (temporarily more lenient for debugging)
      if (!file.type) {
        clearTimeout(timeoutId);
        return new Response(JSON.stringify({
          success: false,
          message: 'No file type detected'
        }), { status: 400 });
      }
      
      // Allow common image types and also check file extension as fallback
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const fileExtension = file.name.toLowerCase().split('.').pop();
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension || '')) {
        clearTimeout(timeoutId);
        return new Response(JSON.stringify({
          success: false,
          message: `Only image files are allowed. Received type: ${file.type}, extension: ${fileExtension}`
        }), { status: 400 });
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        clearTimeout(timeoutId);
        return new Response(JSON.stringify({
          success: false,
          message: `File size must be less than 10MB. Received: ${(file.size / 1024 / 1024).toFixed(2)}MB`
        }), { status: 400 });
      }

      // Check Cloudinary configuration
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        clearTimeout(timeoutId);
        return new Response(JSON.stringify({
          success: false,
          message: 'Upload service configuration error'
        }), { status: 500 });
      }

      // Convert file to buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Upload to Cloudinary with timeout handling
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
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
        );
        
        uploadStream.end(buffer);
      });

      clearTimeout(timeoutId);
      return new Response(JSON.stringify({
        success: true,
        url: (result as any).secure_url,
        public_id: (result as any).public_id,
        imageUrl: (result as any).secure_url // Add imageUrl for compatibility
      }), { status: 200 });
      
    } catch (uploadError: any) {
      clearTimeout(timeoutId);
      if (uploadError.name === 'AbortError') {
        return new Response(JSON.stringify({
          success: false,
          message: 'Upload timeout - file is too large or server is slow. Please try again.'
        }), { status: 408 });
      }
      
      throw uploadError;
    }

  } catch (error: any) {
    // Handle specific error types
    if (error.name === 'AbortError') {
      return new Response(JSON.stringify({
        success: false,
        message: 'Upload timeout - please try again with a smaller file or check your connection.'
      }), { status: 408 });
    }
    
    if (error.message && error.message.includes('cloudinary')) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Upload service error - please try again later.'
      }), { status: 503 });
    }
    
    return new Response(JSON.stringify({
      success: false,
      message: `Failed to upload file: ${error.message || 'Unknown error'}`
    }), { status: 500 });
  }
}
