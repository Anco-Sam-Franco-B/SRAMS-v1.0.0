import multer from 'multer';
import path from 'path';

const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/csv', 'application/vnd.ms-excel'],
  any: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/csv', 'application/vnd.ms-excel'],
};

const MAX_SIZES = {
  image: 5 * 1024 * 1024,
  document: 10 * 1024 * 1024,
  any: 10 * 1024 * 1024,
};

const storage = multer.memoryStorage();

function fileFilter(category = 'any') {
  return (req, file, cb) => {
    if (ALLOWED_TYPES[category]?.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed. Accepted: ${ALLOWED_TYPES[category]?.join(', ')}`));
    }
  };
}

export const uploadImage = multer({
  storage,
  limits: { fileSize: MAX_SIZES.image },
  fileFilter: fileFilter('image'),
});

export const uploadDocument = multer({
  storage,
  limits: { fileSize: MAX_SIZES.document },
  fileFilter: fileFilter('document'),
});

export const uploadAny = multer({
  storage,
  limits: { fileSize: MAX_SIZES.any },
  fileFilter: fileFilter('any'),
});

export function handleMulterError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
}
