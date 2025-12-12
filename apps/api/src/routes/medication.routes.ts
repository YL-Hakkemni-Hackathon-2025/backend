import { Router } from 'express';
import { medicationController } from '../controllers';
import { validateBody, validateParams } from '../middleware/validate';
import { CreateMedicationDto, UpdateMedicationDto, IdParamDto } from '@hakkemni/dto';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @openapi
 * /medications:
 *   post:
 *     tags: [Medications]
 *     summary: Create a medication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [medicationName, dosageAmount, frequency, startDate]
 *             properties:
 *               medicationName:
 *                 type: string
 *                 example: Lisinopril
 *               dosageAmount:
 *                 type: string
 *                 example: 10mg
 *               frequency:
 *                 type: string
 *                 enum: [once_daily, twice_daily, three_times_daily, four_times_daily, as_needed, weekly, monthly, other]
 *                 example: once_daily
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Medication created
 *   get:
 *     tags: [Medications]
 *     summary: Get all medications
 *     parameters:
 *       - name: activeOnly
 *         in: query
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: List of medications
 */
router.post(
  '/',
  validateBody(CreateMedicationDto),
  medicationController.create.bind(medicationController)
);

router.get('/', medicationController.findAll.bind(medicationController));

/**
 * @openapi
 * /medications/{id}:
 *   get:
 *     tags: [Medications]
 *     summary: Get a medication by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Medication details
 *       404:
 *         description: Not found
 *   patch:
 *     tags: [Medications]
 *     summary: Update a medication
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
 *               medicationName:
 *                 type: string
 *               dosageAmount:
 *                 type: string
 *               frequency:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Medication updated
 *   delete:
 *     tags: [Medications]
 *     summary: Delete a medication
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Medication deleted
 */
router.get(
  '/:id',
  validateParams(IdParamDto),
  medicationController.findById.bind(medicationController)
);

router.patch(
  '/:id',
  validateParams(IdParamDto),
  validateBody(UpdateMedicationDto),
  medicationController.update.bind(medicationController)
);

router.delete(
  '/:id',
  validateParams(IdParamDto),
  medicationController.delete.bind(medicationController)
);

export { router as medicationRouter };
