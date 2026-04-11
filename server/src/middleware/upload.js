import multer from 'multer';

// Memory storage keeps the file data as a Buffer in memory instead of writing to disk.
// This is perfect for streaming directly to Cloudinary.
const storage = multer.memoryStorage();

// File validation filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/webp') {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file format. Please upload JPEG, PNG, or WEBP.'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit to prevent memory bloating and conserve Cloudinary bandwidth
  },
  fileFilter,
});

export default upload;
