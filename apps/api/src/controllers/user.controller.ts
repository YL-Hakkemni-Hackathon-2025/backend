import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { userService } from '@hakkemni/services';

export class UserController {
  async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await userService.findById(req.user!.userId);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async updateMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await userService.update(req.user!.userId, req.body);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const summary = await userService.getFullSummary(req.user!.userId);
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
