import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export const uploadImageToCloudinary = (
  buffer: Buffer,
  folder = 'workshop_mds_sparing_finder_profiles'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        if (!result?.secure_url) return reject(new Error('Upload failed'));
        resolve(result.secure_url);
      }
    );

    Readable.from(buffer).pipe(stream);
  });
};
