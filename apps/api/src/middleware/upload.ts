import multer from 'multer';
import { Request } from 'express';
import { ValidationError } from '@hakkemni/common';

// Allowed image mime types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

// Allowed document mime types (images + PDF)
const ALLOWED_DOCUMENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/gif',
  'application/pdf'
];

// File filter to only accept images
const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new ValidationError(`Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`));
  }
};

// File filter to accept documents (images + PDF)
const documentFileFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
) => {
  if (ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new ValidationError(`Invalid file type. Allowed types: ${ALLOWED_DOCUMENT_TYPES.join(', ')}`));
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

// Configure multer for document uploads (images + PDF)
export const uploadDocument = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max for documents
  },
  fileFilter: documentFileFilter,
});

// Single image upload middleware
export const uploadSingleImage = (fieldName: string = 'image') => {
  return uploadImage.single(fieldName);
};

// Single document upload middleware
export const uploadSingleDocument = (fieldName: string = 'file') => {
  return uploadDocument.single(fieldName);
};

