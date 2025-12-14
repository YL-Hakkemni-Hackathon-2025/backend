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
 *     description: |
 *       Create a new allergy record. The allergy type (drug, food, environmental, etc.)
 *       is automatically inferred by AI based on the allergen name.
 *
 *       Include reaction details in the notes field.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [allergen]
 *             properties:
 *               allergen:
 *                 type: string
 *                 example: Peanuts
 *               severity:
 *                 type: string
 *                 enum: [mild, moderate, severe, life_threatening]
 *                 example: severe
 *               diagnosedDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *                 description: Include reaction details here
 *                 example: "Causes anaphylaxis. Carry EpiPen at all times."
 *     responses:
 *       201:
 *         description: Allergy created (type is AI-inferred)
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
 *                     allergen:
 *                       type: string
 *                     type:
 *                       type: string
 *                       description: AI-inferred allergy type
 *                       enum: [drug, food, environmental, insect, latex, other]
 *                     severity:
 *                       type: string
 *                     notes:
 *                       type: string
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
 *     description: |
 *       Update an allergy record. If the allergen name is changed, the type will be
 *       re-inferred by AI automatically.
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
 *               severity:
 *                 type: string
 *                 enum: [mild, moderate, severe, life_threatening]
 *               diagnosedDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *                 description: Include reaction details here
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
