# Cloudinary Setup Guide

## 1. Create Cloudinary Account

1. Go to [Cloudinary](https://cloudinary.com/) and sign up for a free account
2. Verify your email address

## 2. Get Your Credentials

1. Log in to your Cloudinary dashboard
2. Go to the "Dashboard" section
3. Copy your credentials:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

## 3. Add Environment Variables

Add these variables to your `.env.local` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 4. Features

- **Automatic Image Optimization**: Images are automatically resized and optimized
- **Secure URLs**: All uploaded images use HTTPS
- **Folder Organization**: Images are stored in the `crm-orders` folder
- **File Validation**: Only image files up to 5MB are accepted
- **Real-time Upload**: Images upload immediately when selected

## 5. Image Transformations

Images are automatically processed with:
- Max width: 800px
- Max height: 600px
- Auto quality optimization
- Maintains aspect ratio

## 6. Supported Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

## 7. Usage

1. Select an image in the order form
2. Image will automatically upload to Cloudinary
3. The Cloudinary URL will be saved with the order
4. Images are displayed in the order details

## 8. Security

- Authentication required for uploads
- File type validation
- File size limits
- Secure HTTPS URLs
