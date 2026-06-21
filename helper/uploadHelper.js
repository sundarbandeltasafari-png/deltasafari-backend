const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const createUploader = (type = 'image', subfolder = '') => {
  let allowedMimes = [];
  let maxSize = 0;

  // 1. Define configurations based on type
  if (type === 'video') {
    allowedMimes = ['video/mp4', 'video/mpeg', 'video/quicktime'];
    maxSize = 100 * 1024 * 1024; // 100MB
  } else if (type === 'both') {
    allowedMimes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    maxSize = 100 * 1024 * 1024; // 100MB
  } else {
    allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    maxSize = 50 * 1024 * 1024; // 50MB
  }

  // 2. Custom Storage Engine
  const customStorage = {
    _handleFile: (req, file, cb) => {
      const uploadPath = path.join('uploads', subfolder);
      fs.mkdirSync(uploadPath, { recursive: true });

      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

      // Handle Videos
      if (file.mimetype.startsWith('video/')) {
        const filename = `${uniqueSuffix}${path.extname(file.originalname)}`;
        const fullPath = path.join(uploadPath, filename);
        const outStream = fs.createWriteStream(fullPath);

        file.stream.pipe(outStream);
        outStream.on('error', cb);
        outStream.on('finish', () => {
          cb(null, { destination: uploadPath, filename: filename, path: fullPath, size: outStream.bytesWritten });
        });
      }

      // Handle and Optimize Images
      else if (file.mimetype.startsWith('image/')) {
        const filename = `${uniqueSuffix}.jpg`; // Enforce .jpg extension
        const fullPath = path.join(uploadPath, filename);

        // Setup Sharp transformation pipeline
        const transform = sharp()
          .resize({ width: 1200, withoutEnlargement: true }) // Resize to max 1200px width safely
          .jpeg({ quality: 80, progressive: true }); // Convert to progressive JPEG at 80% quality

        const outStream = fs.createWriteStream(fullPath);

        // Pipe: Upload Stream -> Sharp Optimization -> Disk Storage
        file.stream.pipe(transform).pipe(outStream);

        outStream.on('error', cb);
        outStream.on('finish', () => {
          cb(null, {
            destination: uploadPath,
            filename: filename,
            path: fullPath,
            mimetype: 'image/jpeg',
            size: outStream.bytesWritten
          });
        });
      }
    },

    _removeFile: (req, file, cb) => {
      if (file.path) {
        fs.unlink(file.path, cb);
      } else {
        cb(null);
      }
    }
  };

  // 3. Return the standard Multer instance configured with our custom engine
  return multer({
    storage: customStorage,
    limits: { fileSize: maxSize },
    fileFilter: (req, file, cb) => {
      if (!allowedMimes.includes(file.mimetype)) {
        return cb(new Error(`Invalid file type for mode "${type}".`));
      }
      cb(null, true);
    }
  });
};

module.exports = { createUploader };