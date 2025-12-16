import { Router } from 'express';
import { lifestyleController } from '../controllers';
import { validateBody } from '../middleware/validate';
import { UpdateLifestyleDto, HabitDto } from '@hakkemni/dto';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @openapi
 * /lifestyles:
 *   get:
 *     tags: [Lifestyles]
 *     summary: Get current user's lifestyle (creates if not exists)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's lifestyle with all habits
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
 *                     userId:
 *                       type: string
 *                     habits:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             type: string
 *                             enum: [smoking, alcohol, exercise, diet, sleep, stress, other]
 *                           frequency:
 *                             type: string
 *                             enum: [not_set, never, rarely, occasionally, frequently, daily]
 *                           notes:
 *                             type: string
 *   put:
 *     tags: [Lifestyles]
 *     summary: Update all lifestyle habits at once
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [habits]
 *             properties:
 *               habits:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [category, frequency]
 *                   properties:
 *                     category:
 *                       type: string
 *                       enum: [smoking, alcohol, exercise, diet, sleep, stress, other]
 *                       example: smoking
 *                     frequency:
 *                       type: string
 *                       enum: [not_set, never, rarely, occasionally, frequently, daily]
 *                       example: never
 *                     notes:
 *                       type: string
 *           example:
 *             habits:
 *               - category: smoking
 *                 frequency: never
 *               - category: alcohol
 *                 frequency: rarely
 *               - category: exercise
 *                 frequency: daily
 *               - category: sleep
 *                 frequency: occasionally
 *               - category: stress
 *                 frequency: frequently
 *     responses:
 *       200:
 *         description: Updated lifestyle
 *   delete:
 *     tags: [Lifestyles]
 *     summary: Delete lifestyle (reset all habits)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lifestyle deleted
 */
router.get('/', lifestyleController.get.bind(lifestyleController));

router.put(
  '/',
  validateBody(UpdateLifestyleDto),
  lifestyleController.update.bind(lifestyleController)
);

router.delete('/', lifestyleController.delete.bind(lifestyleController));

/**
 * @openapi
 * /lifestyles/habit:
 *   patch:
 *     tags: [Lifestyles]
 *     summary: Update a single habit
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [category, frequency]
 *             properties:
 *               category:
 *                 type: string
 *                 enum: [smoking, alcohol, exercise, diet, sleep, stress, other]
 *                 example: smoking
 *               frequency:
 *                 type: string
 *                 enum: [not_set, never, rarely, occasionally, frequently, daily]
 *                 example: never
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated lifestyle with all habits
 */
router.patch(
  '/habit',
  validateBody(HabitDto),
  lifestyleController.updateHabit.bind(lifestyleController)
);

export default router;
