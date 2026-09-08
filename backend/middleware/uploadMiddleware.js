const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const { uploadBuffer } = require('../config/storage');

// ============================================================================
// middleware/uploadMiddleware.js — Image Upload Pipeline
// ============================================================================
// WHAT THIS FILE DOES:
//   Step 1: multer catches the file from the HTTP request (keeps it in RAM)
//   Step 2: fileFilter blocks non-image files (security)
//   Step 3: processImage compresses the image with sharp (strips malware)
//   Step 4: uploadBuffer sends the compressed image to Supabase Storage (CDN)
//   Step 5: req.processedFile holds the public CDN URL for controllers to save
// WHY NOT SAVE TO LOCAL DISK?
//   Free hosting platforms wipe local files on every deploy. Supabase Storage
//   persists forever and serves through a global CDN so images load fast.
// ============================================================================

const storage = multer.memoryStorage(); // Keep file in RAM, not disk

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Only images (jpeg, jpg, png, webp) are allowed'));
  },
});

// SECURITY: Re-encode image with sharp, then upload to Supabase Storage CDN
const processImage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    // 1. Compress and sanitize with sharp
    const compressed = await sharp(req.file.buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80, progressive: true })
      .toBuffer();

    // 2. Create a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const folder = req.file.fieldname === 'profileImage' ? 'profiles' : 'products';
    const filename = `${folder}/${req.user.id}-${uniqueSuffix}.jpg`;

    // 3. Upload to Supabase Storage (free CDN)
    const cdnUrl = await uploadBuffer(compressed, filename);

    // 4. Attach the public CDN URL to req so controllers can save it in Prisma
    req.processedFile = { url: cdnUrl, filename };
    next();
  } catch (err) {
    console.error('Image processing error:', err.message);
    return res.status(400).json({ message: 'Invalid image file' });
  }
};

module.exports = { upload, processImage };