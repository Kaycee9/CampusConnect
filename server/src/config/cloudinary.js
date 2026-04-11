import cloudinaryPkg from 'cloudinary';
const cloudinary = cloudinaryPkg.v2;
import env from './env.js';

// Configure Cloudinary SDK with environment secrets
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
