import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with modern URL API
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Use HTTPS
});

// Suppress deprecation warnings
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export default cloudinary;
