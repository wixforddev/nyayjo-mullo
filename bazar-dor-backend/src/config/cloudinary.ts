import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file buffer to Cloudinary.
 * Returns the secure HTTPS URL stored in MongoDB.
 */
export const uploadToCloudinary = (buffer: Buffer, folder = 'bazar-dor'): Promise<string> =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type: 'image' }, (err, result) => {
        if (err || !result) return reject(err ?? new Error('Cloudinary upload failed'));
        resolve(result.secure_url);
      })
      .end(buffer);
  });

/**
 * Delete an asset from Cloudinary by its full secure URL.
 * Extracts the public_id automatically.
 * Safe to call with empty/undefined — does nothing.
 */
export const deleteFromCloudinary = async (url?: string): Promise<void> => {
  if (!url || !url.includes('cloudinary.com')) return;
  // Extract public_id: everything after "/upload/vXXXX/" up to the file extension
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i);
  if (!match) return;
  await cloudinary.uploader.destroy(match[1]).catch(() => {});
};

export { cloudinary };
