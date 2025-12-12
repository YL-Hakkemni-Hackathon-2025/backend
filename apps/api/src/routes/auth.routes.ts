import { Router } from 'express';
import { authController } from '../controllers';
import { validateBody } from '../middleware/validate';
import { uploadSingleImage } from '../middleware/upload';
import { RefreshTokenDto } from '@hakkemni/dto';

const router = Router();

/**
 * @openapi
 * /auth/verify-id:
 *   post:
 *     tags: [Auth]
 *     summary: Verify Lebanese ID and authenticate
 *     description: Processes a Lebanese ID card image, extracts data, and authenticates or registers the user.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Lebanese ID card image (JPEG, PNG, WebP)
 *     responses:
 *       200:
 *         description: Authentication successful
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
 *                     isNewUser:
 *                       type: boolean
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         fullName:
 *                           type: string
 *                     token:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         refreshToken:
 *                           type: string
 *                         expiresIn:
 *                           type: number
 *                     extractedData:
 *                       type: object
 *                       description: Only returned for new users
 *       400:
 *         description: Invalid request or ID processing failed
 */
router.post(
  '/verify-id',
  uploadSingleImage('image'),
  authController.verifyId.bind(authController)
);

/**
 * @openapi
 * /auth/extract-id:
 *   post:
 *     tags: [Auth]
 *     summary: Extract Lebanese ID data (preview only)
 *     description: Extracts data from Lebanese ID without authenticating.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Lebanese ID card image (JPEG, PNG, WebP)
 *     responses:
 *       200:
 *         description: Data extracted successfully
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
 *                     first_name:
 *                       type: string
 *                     last_name:
 *                       type: string
 *                     government_id:
 *                       type: string
 *                     date_of_birth:
 *                       type: string
 *                     birth_place:
 *                       type: string
 *                     dad_name:
 *                       type: string
 *                     mom_full_name:
 *                       type: string
 */
router.post(
  '/extract-id',
  uploadSingleImage('image'),
  authController.extractId.bind(authController)
);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tokens refreshed
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
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     expiresIn:
 *                       type: number
 *       401:
 *         description: Invalid refresh token
 */
router.post(
  '/refresh',
  validateBody(RefreshTokenDto),
  authController.refreshToken.bind(authController)
);

export { router as authRouter };
