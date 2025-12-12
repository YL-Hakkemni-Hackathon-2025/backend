import { Router } from 'express';
import { medicalConditionController } from '../controllers';
import { validateBody, validateParams } from '../middleware/validate';
import { CreateMedicalConditionDto, UpdateMedicalConditionDto, IdParamDto } from '@hakkemni/dto';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @openapi
 * /medical-conditions:
 *   post:
 *     tags: [Medical Conditions]
 *     summary: Create a medical condition
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Hypertension
 *               diagnosedDate:
 *                 type: string
 *                 format: date
 *                 example: "2023-06-15"
 *               notes:
 *                 type: string
 *                 example: Controlled with medication
 *     responses:
 *       201:
 *         description: Condition created
 *   get:
 *     tags: [Medical Conditions]
 *     summary: Get all medical conditions
 *     parameters:
 *       - name: activeOnly
 *         in: query
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Filter to active conditions only
 *     responses:
 *       200:
 *         description: List of medical conditions
 */
router.post(
  '/',
  validateBody(CreateMedicalConditionDto),
  medicalConditionController.create.bind(medicalConditionController)
);

router.get('/', medicalConditionController.findAll.bind(medicalConditionController));

/**
 * @openapi
 * /medical-conditions/{id}:
 *   get:
 *     tags: [Medical Conditions]
 *     summary: Get a medical condition by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Medical condition details
 *       404:
 *         description: Not found
 *   patch:
 *     tags: [Medical Conditions]
 *     summary: Update a medical condition
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
 *               name:
 *                 type: string
 *               diagnosedDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Condition updated
 *   delete:
 *     tags: [Medical Conditions]
 *     summary: Delete a medical condition
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Condition deleted
 */
router.get(
  '/:id',
  validateParams(IdParamDto),
  medicalConditionController.findById.bind(medicalConditionController)
);

router.patch(
  '/:id',
  validateParams(IdParamDto),
  validateBody(UpdateMedicalConditionDto),
  medicalConditionController.update.bind(medicalConditionController)
);

router.delete(
  '/:id',
  validateParams(IdParamDto),
  medicalConditionController.delete.bind(medicalConditionController)
);

export { router as medicalConditionRouter };
