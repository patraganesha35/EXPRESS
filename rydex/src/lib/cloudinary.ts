import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary globally
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Uploads a file (Blob) directly to Cloudinary using memory streams.
 * This is the industry-standard way to upload files in Next.js without saving to disk.
 */
const uploadOnCloudinary = async (file: Blob): Promise<string | null> => {
  if (!file) return null;
  
  try {
    // 1. Convert the Web Blob into a Node.js Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // 2. Upload the Buffer to Cloudinary via a Stream
    return await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { 
          resource_type: "auto",
          folder: "rydex_documents", // Organizes your uploads into a specific folder in Cloudinary
        },
        (error, result) => {
          if (error) {
            // If Cloudinary rejects the credentials, throw the error so the API route can catch it
            reject(error);
          } else {
            // Successfully uploaded, return the secure HTTPS URL
            resolve(result?.secure_url ?? null);
          }
        }
      );
      
      // End the stream with the buffer data
      uploadStream.end(buffer);
    });

  } catch (error: any) {
    console.error("Cloudinary Upload Error:", error);
    
    // If the error is 403 (Forbidden), it means the API keys are invalid
    if (error.message?.includes('403') || error.http_code === 403) {
      throw new Error(
        "Cloudinary Access Denied (403): Your Cloudinary API Key or Secret in .env.local is incorrect or your system clock is out of sync."
      );
    }
    
    // Rethrow any other Cloudinary errors
    throw new Error(`Cloudinary Error: ${error.message || 'Upload failed'}`);
  }
}

export default uploadOnCloudinary;