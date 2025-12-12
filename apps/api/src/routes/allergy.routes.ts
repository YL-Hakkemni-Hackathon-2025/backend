import { Router } from 'express';
import { allergyController } from '../controllers';
import { validateBody, validateParams } from '../middleware/validate';
import { CreateAllergyDto, UpdateAllergyDto, IdParamDto } from '@hakkemni/dto';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @openapi
 * /allergies:
 *   post:
 *     tags: [Allergies]
 *     summary: Create an allergy
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [allergen, type]
 *             properties:
 *               allergen:
 *                 type: string
 *                 example: Peanuts
 *               type:
 *                 type: string
 *                 enum: [drug, food, environmental, insect, latex, other]
 *                 example: food
 *               severity:
 *                 type: string
 *                 enum: [mild, moderate, severe, life_threatening]
 *                 example: severe
 *               reaction:
 *                 type: string
 *                 example: Anaphylaxis
 *               diagnosedDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Allergy created
 *   get:
 *     tags: [Allergies]
 *     summary: Get all allergies
 *     parameters:
 *       - name: activeOnly
 *         in: query
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: List of allergies
 */
router.post(
  '/',
  validateBody(CreateAllergyDto),
  allergyController.create.bind(allergyController)
);

router.get('/', allergyController.findAll.bind(allergyController));

/**
 * @openapi
 * /allergies/{id}:
 *   get:
 *     tags: [Allergies]
 *     summary: Get an allergy by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Allergy details
 *       404:
 *         description: Not found
 *   patch:
 *     tags: [Allergies]
 *     summary: Update an allergy
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
 *               allergen:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [drug, food, environmental, insect, latex, other]
 *               severity:
 *                 type: string
 *                 enum: [mild, moderate, severe, life_threatening]
 *               reaction:
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
 *         description: Allergy updated
 *   delete:
 *     tags: [Allergies]
 *     summary: Delete an allergy
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Allergy deleted
 */
router.get(
  '/:id',
  validateParams(IdParamDto),
  allergyController.findById.bind(allergyController)
);

router.patch(
  '/:id',
  validateParams(IdParamDto),
  validateBody(UpdateAllergyDto),
  allergyController.update.bind(allergyController)
);

router.delete(
  '/:id',
  validateParams(IdParamDto),
  allergyController.delete.bind(allergyController)
);

export { router as allergyRouter };
