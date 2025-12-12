import multer from 'multer';
import { Request } from 'express';
import { ValidationError } from '@hakkemni/common';

// Allowed image mime types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

// File filter to only accept images
const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new ValidationError(`Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`));
  }
};

// Configure multer for memory storage (keeps file in buffer)
export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: imageFileFilter,
});

// Single image upload middleware
export const uploadSingleImage = (fieldName: string = 'image') => {
  return uploadImage.single(fieldName);
};

