import { Router } from 'express';
import { userController } from '../controllers';
import { validateBody } from '../middleware/validate';
import { UpdateUserDto } from '@hakkemni/dto';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @openapi
 * /users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get current user profile
 *     responses:
 *       200:
 *         description: User profile
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
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                     governmentId:
 *                       type: string
 *                     dateOfBirth:
 *                       type: string
 *                       format: date
 *                     gender:
 *                       type: string
 *                       enum: [male, female, other]
 *                     birthPlace:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 *                     email:
 *                       type: string
 */
router.get('/me', userController.getMe.bind(userController));

/**
 * @openapi
 * /users/me:
 *   patch:
 *     tags: [Users]
 *     summary: Update current user profile
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *               phoneNumber:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: User updated
 */
router.patch(
  '/me',
  validateBody(UpdateUserDto),
  userController.updateMe.bind(userController)
);

/**
 * @openapi
 * /users/summary:
 *   get:
 *     tags: [Users]
 *     summary: Get user health summary
 *     description: Returns a summary of user health data for HealthPass preview
 *     responses:
 *       200:
 *         description: User health summary
 */
router.get('/summary', userController.getSummary.bind(userController));

export { router as userRouter };
