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
 *     summary: Get user full health summary
 *     description: Returns a complete summary of user profile and all health data including medical conditions, medications, allergies, lifestyles, and documents
 *     responses:
 *       200:
 *         description: User full health summary
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
 *                     birthPlace:
 *                       type: string
 *                     gender:
 *                       type: string
 *                       enum: [male, female, other]
 *                     medicalConditions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           diagnosedDate:
 *                             type: string
 *                             format: date
 *                           notes:
 *                             type: string
 *                           isActive:
 *                             type: boolean
 *                     medications:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           medicationName:
 *                             type: string
 *                           dosageAmount:
 *                             type: string
 *                           frequency:
 *                             type: string
 *                           startDate:
 *                             type: string
 *                             format: date
 *                           endDate:
 *                             type: string
 *                             format: date
 *                           notes:
 *                             type: string
 *                           isActive:
 *                             type: boolean
 *                     allergies:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           allergen:
 *                             type: string
 *                           type:
 *                             type: string
 *                             enum: [drug, food, environmental, insect, latex, other]
 *                           severity:
 *                             type: string
 *                             enum: [mild, moderate, severe, life_threatening]
 *                           reaction:
 *                             type: string
 *                           notes:
 *                             type: string
 *                           isActive:
 *                             type: boolean
 *                     lifestyles:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           category:
 *                             type: string
 *                           description:
 *                             type: string
 *                           frequency:
 *                             type: string
 *                           notes:
 *                             type: string
 *                           isActive:
 *                             type: boolean
 *                     documents:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           documentName:
 *                             type: string
 *                           documentType:
 *                             type: string
 *                           documentDate:
 *                             type: string
 *                             format: date
 *                           fileUrl:
 *                             type: string
 *                           notes:
 *                             type: string
 *                           isActive:
 *                             type: boolean
 */
router.get('/summary', userController.getSummary.bind(userController));

export { router as userRouter };
