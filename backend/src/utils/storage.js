const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Cloudinary is opt-in; without these vars uploads go to backend/uploads exactly as before
const useCloudinary = () => Boolean(
  process.env.CLOUDINARY_URL ||
  (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
);

function getUploadStorage() {
  if (useCloudinary()) return multer.memoryStorage();
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
    filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
  });
}

async function getUploadedFileUrl(file) {
  if (!useCloudinary()) return `/uploads/${file.filename}`;

  const cloudinary = require('cloudinary').v2; // reads CLOUDINARY_URL from env by itself
  if (!process.env.CLOUDINARY_URL) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ resource_type: 'auto', folder: 'smartbid' }, (err, result) => (err ? reject(err) : resolve(result.secure_url)))
      .end(file.buffer);
  });
}

module.exports = { useCloudinary, getUploadStorage, getUploadedFileUrl };
