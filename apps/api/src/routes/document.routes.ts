import { Router } from 'express';
import { documentController } from '../controllers';
import { validateBody, validateParams } from '../middleware/validate';
import { ConfirmDocumentDto, UpdateDocumentDto, IdParamDto } from '@hakkemni/dto';
import { authenticate } from '../middleware/auth';
import { SUPPORTED_DOCUMENT_FORMATS, MAX_FILE_SIZE_MB } from '@hakkemni/common';
import multer from 'multer';

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (SUPPORTED_DOCUMENT_FORMATS.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type. Supported: ${SUPPORTED_DOCUMENT_FORMATS.join(', ')}`));
    }
  }
});

// All routes require authentication
router.use(authenticate);

/**
 * @openapi
 * /documents/upload:
 *   post:
 *     tags: [Documents]
 *     summary: Upload a document
 *     description: Upload a medical document. AI will analyze and suggest name, date, and notes.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: PDF, JPEG, PNG, or WEBP file (max 10MB)
 *     responses:
 *       201:
 *         description: Document uploaded and processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     suggestedName:
 *                       type: string
 *                       description: AI-suggested document name
 *                     suggestedDate:
 *                       type: string
 *                       format: date
 *                     suggestedNotes:
 *                       type: string
 *                       description: AI-generated summary
 *                     documentType:
 *                       type: string
 *                     isConfirmed:
 *                       type: boolean
 *                       example: false
 */
router.post(
  '/upload',
  upload.single('file'),
  documentController.upload.bind(documentController)
);

/**
 * @openapi
 * /documents/{id}/confirm:
 *   post:
 *     tags: [Documents]
 *     summary: Confirm document with edits
 *     description: After upload, user reviews AI suggestions and confirms with optional edits.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [documentName, documentType]
 *             properties:
 *               documentName:
 *                 type: string
 *               documentType:
 *                 type: string
 *                 enum: [lab_report, mri_scan, ct_scan, x_ray, prescription, medical_report, vaccination_record, other]
 *               documentDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document confirmed
 */
router.post(
  '/:id/confirm',
  validateParams(IdParamDto),
  validateBody(ConfirmDocumentDto),
  documentController.confirm.bind(documentController)
);

/**
 * @openapi
 * /documents:
 *   get:
 *     tags: [Documents]
 *     summary: Get all documents
 *     parameters:
 *       - name: confirmedOnly
 *         in: query
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: List of documents
 */
router.get('/', documentController.findAll.bind(documentController));

/**
 * @openapi
 * /documents/{id}:
 *   get:
 *     tags: [Documents]
 *     summary: Get a document by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document details
 *       404:
 *         description: Not found
 *   patch:
 *     tags: [Documents]
 *     summary: Update a document
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               documentName:
 *                 type: string
 *               documentType:
 *                 type: string
 *                 enum: [lab_report, mri_scan, ct_scan, x_ray, prescription, medical_report, vaccination_record, other]
 *               documentDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document updated
 *   delete:
 *     tags: [Documents]
 *     summary: Delete a document
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document deleted
 */
router.get(
  '/:id',
  validateParams(IdParamDto),
  documentController.findById.bind(documentController)
);

router.patch(
  '/:id',
  validateParams(IdParamDto),
  validateBody(UpdateDocumentDto),
  documentController.update.bind(documentController)
);

router.delete(
  '/:id',
  validateParams(IdParamDto),
  documentController.delete.bind(documentController)
);

export { router as documentRouter };
