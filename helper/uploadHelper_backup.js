const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const createUploader = (type = 'image', subfolder = '') => {
  // 1. Define configurations based on type
  let allowedMimes = [];
  let maxSize = 0;

  if (type === 'video') {
    allowedMimes = ['video/mp4', 'video/mpeg', 'video/quicktime'];
    maxSize = 100 * 1024 * 1024; // 100MB for videos
  } else if (type == "both") {
    allowedMimes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    maxSize = 100 * 1024 * 1024; // 50MB for photos
  }
  else {
    allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    maxSize = 5 * 1024 * 1024; // 5MB for photos
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join('uploads', subfolder);
      fs.mkdirSync(uploadPath, { recursive: true }); // Auto-create folder
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  });


  return multer({
    storage: storage,
    limits: { fileSize: maxSize },
    fileFilter: (req, file, cb) => {
      if (!allowedMimes.includes(file.mimetype)) {
        return cb(new Error(`Invalid file type. Mixed formats allowed: Images & Videos.`));
      }
      cb(null, true);
    }
  });
};


const optimizeImage = async (filePath) => {
  const ext = path.extname(filePath);
  const dirname = path.dirname(filePath);
  const basename = path.basename(filePath, ext);

  // Create a new path for the optimized image (converting to WebP)
  const outputPath = path.join(dirname, `${basename}-optimized.webp`);

  await sharp(filePath)
    .resize({ width: 1200, withoutEnlargement: true }) // Resize to a max width of 1200px
    .webp({ quality: 80 }) // Convert to WebP and set quality to 80%
    .toFile(outputPath);

  // Delete the original unoptimized file to save space
  fs.unlinkSync(filePath);

  return outputPath;
};

module.exports = { createUploader, optimizeImage };