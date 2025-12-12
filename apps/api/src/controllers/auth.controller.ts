import { Response, NextFunction, Request } from 'express';
import { authService, lebaneseIdService } from '@hakkemni/services';
import { ValidationError } from '@hakkemni/common';

export class AuthController {
  async verifyId(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new ValidationError('Image file is required');
      }
      const result = await authService.authenticateWithLebanesIdFromBuffer(
        req.file.buffer,
        req.file.mimetype
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async extractId(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new ValidationError('Image file is required');
      }
      const idData = await lebaneseIdService.processLebanesIdFromBuffer(
        req.file.buffer,
        req.file.mimetype
      );
      res.json({ success: true, data: idData });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshToken(refreshToken);
      res.json({ success: true, data: tokens });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
