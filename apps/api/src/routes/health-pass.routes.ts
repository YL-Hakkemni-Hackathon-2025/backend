import { Router } from 'express';
import { healthPassController } from '../controllers';
import { validateBody, validateParams } from '../middleware/validate';
import { CreateHealthPassDto, UpdateHealthPassDto, IdParamDto, ToggleHealthPassItemDto } from '@hakkemni/dto';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @openapi
 * /health-passes/access/{accessCode}:
 *   get:
 *     tags: [Health Passes]
 *     summary: Access health pass by QR code
 *     description: Public endpoint for doctors to view patient data after scanning QR code.
 *     security: []
 *     parameters:
 *       - name: accessCode
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Health pass preview
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
 *                     patientName:
 *                       type: string
 *                     dateOfBirth:
 *                       type: string
 *                       format: date
 *                     gender:
 *                       type: string
 *                     appointmentSpecialty:
 *                       type: string
 *                     medicalConditions:
 *                       type: array
 *                       items:
 *                         type: object
 *                     medications:
 *                       type: array
 *                       items:
 *                         type: object
 *                     allergies:
 *                       type: array
 *                       items:
 *                         type: object
 *                     aiRecommendations:
 *                       type: string
 *       404:
 *         description: Health pass not found or expired
 */
router.get(
  '/access/:accessCode',
  healthPassController.accessByCode.bind(healthPassController)
);

// Protected routes below
router.use(authenticate);

/**
 * @openapi
 * /health-passes:
 *   post:
 *     tags: [Health Passes]
 *     summary: Create a health pass
 *     description: Generate a new HealthPass with QR code. AI suggests which data to share based on appointment specialty.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [appointmentSpecialty]
 *             properties:
 *               appointmentSpecialty:
 *                 type: string
 *                 enum: [gastroenterology, orthopedics, cardiology, dermatology, neurology, ophthalmology, pediatrics, psychiatry, radiology, urology, gynecology, oncology, pulmonology, rheumatology, endocrinology, nephrology, general_practice, emergency, other]
 *                 example: cardiology
 *               appointmentDate:
 *                 type: string
 *                 format: date-time
 *               appointmentNotes:
 *                 type: string
 *               dataToggles:
 *                 type: object
 *                 description: Override AI-suggested toggles. Name, gender, DOB are always on.
 *                 properties:
 *                   medicalConditions:
 *                     type: boolean
 *                   medications:
 *                     type: boolean
 *                   allergies:
 *                     type: boolean
 *                   lifestyleChoices:
 *                     type: boolean
 *                   documents:
 *                     type: boolean
 *     responses:
 *       201:
 *         description: Health pass created with QR code
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
 *                     qrCode:
 *                       type: string
 *                       description: Base64 encoded QR code image
 *                     accessCode:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [draft, generated, shared, expired]
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                     aiRecommendations:
 *                       type: string
 *   get:
 *     tags: [Health Passes]
 *     summary: Get all health passes
 *     responses:
 *       200:
 *         description: List of health passes
 */
router.post(
  '/',
  validateBody(CreateHealthPassDto),
  healthPassController.create.bind(healthPassController)
);

router.get('/', healthPassController.findAll.bind(healthPassController));

/**
 * @openapi
 * /health-passes/{id}:
 *   get:
 *     tags: [Health Passes]
 *     summary: Get a health pass by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Health pass details
 *       404:
 *         description: Not found
 *   patch:
 *     tags: [Health Passes]
 *     summary: Update a health pass
 *     description: Update data toggles or appointment details.
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
 *               appointmentSpecialty:
 *                 type: string
 *               appointmentDate:
 *                 type: string
 *                 format: date-time
 *               appointmentNotes:
 *                 type: string
 *               dataToggles:
 *                 type: object
 *     responses:
 *       200:
 *         description: Health pass updated
 */
router.get(
  '/:id',
  validateParams(IdParamDto),
  healthPassController.findById.bind(healthPassController)
);

router.patch(
  '/:id',
  validateParams(IdParamDto),
  validateBody(UpdateHealthPassDto),
  healthPassController.update.bind(healthPassController)
);

/**
 * @openapi
 * /health-passes/{id}/regenerate-qr:
 *   post:
 *     tags: [Health Passes]
 *     summary: Regenerate QR code
 *     description: Generate a new QR code and access code, extending expiration.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: New QR code generated
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
 *                     qrCode:
 *                       type: string
 *                       description: Base64 encoded QR image
 */
router.post(
  '/:id/regenerate-qr',
  validateParams(IdParamDto),
  healthPassController.regenerateQr.bind(healthPassController)
);

/**
 * @openapi
 * /health-passes/{id}/toggle-item:
 *   patch:
 *     tags: [Health Passes]
 *     summary: Toggle a specific item in the health pass
 *     description: Enable or disable a specific medical condition, medication, allergy, lifestyle, or document in the health pass.
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
 *             required: [itemType, itemId, isEnabled]
 *             properties:
 *               itemType:
 *                 type: string
 *                 enum: [medicalCondition, medication, allergy, lifestyle, document]
 *                 description: Type of the item to toggle
 *               itemId:
 *                 type: string
 *                 description: ID of the specific item
 *               isEnabled:
 *                 type: boolean
 *                 description: Whether to enable (true) or disable (false) the item
 *     responses:
 *       200:
 *         description: Health pass updated with toggled item
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Updated health pass with all items
 */
router.patch(
  '/:id/toggle-item',
  validateParams(IdParamDto),
  validateBody(ToggleHealthPassItemDto),
  healthPassController.toggleItem.bind(healthPassController)
);

export { router as healthPassRouter };
