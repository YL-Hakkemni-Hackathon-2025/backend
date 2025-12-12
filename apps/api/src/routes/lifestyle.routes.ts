import { Router } from 'express';
import { lifestyleController } from '../controllers';
import { validateBody, validateParams } from '../middleware/validate';
import { CreateLifestyleDto, UpdateLifestyleDto, IdParamDto } from '@hakkemni/dto';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @openapi
 * /lifestyles:
 *   post:
 *     tags: [Lifestyles]
 *     summary: Create a lifestyle choice
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [category, description]
 *             properties:
 *               category:
 *                 type: string
 *                 enum: [smoking, alcohol, exercise, diet, sleep, stress, other]
 *                 example: exercise
 *               description:
 *                 type: string
 *                 example: Regular cardio workout
 *               frequency:
 *                 type: string
 *                 example: 3 times per week
 *               startDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Lifestyle created
 *   get:
 *     tags: [Lifestyles]
 *     summary: Get all lifestyle choices
 *     parameters:
 *       - name: activeOnly
 *         in: query
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: List of lifestyle choices
 */
router.post(
  '/',
  validateBody(CreateLifestyleDto),
  lifestyleController.create.bind(lifestyleController)
);

router.get('/', lifestyleController.findAll.bind(lifestyleController));

/**
 * @openapi
 * /lifestyles/{id}:
 *   get:
 *     tags: [Lifestyles]
 *     summary: Get a lifestyle choice by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lifestyle details
 *       404:
 *         description: Not found
 *   patch:
 *     tags: [Lifestyles]
 *     summary: Update a lifestyle choice
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
 *               category:
 *                 type: string
 *                 enum: [smoking, alcohol, exercise, diet, sleep, stress, other]
 *               description:
 *                 type: string
 *               frequency:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Lifestyle updated
 *   delete:
 *     tags: [Lifestyles]
 *     summary: Delete a lifestyle choice
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lifestyle deleted
 */
router.get(
  '/:id',
  validateParams(IdParamDto),
  lifestyleController.findById.bind(lifestyleController)
);

router.patch(
  '/:id',
  validateParams(IdParamDto),
  validateBody(UpdateLifestyleDto),
  lifestyleController.update.bind(lifestyleController)
);

router.delete(
  '/:id',
  validateParams(IdParamDto),
  lifestyleController.delete.bind(lifestyleController)
);

export { router as lifestyleRouter };
