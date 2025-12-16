import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { lifestyleService } from '@hakkemni/services';

export class LifestyleController {
  /**
   * Get or create lifestyle for current user
   */
  async get(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const lifestyle = await lifestyleService.getOrCreate(req.user!.userId);
      res.json({ success: true, data: lifestyle });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update all lifestyle habits at once
   */
  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const lifestyle = await lifestyleService.update(req.user!.userId, req.body);
      res.json({ success: true, data: lifestyle });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a single habit
   */
  async updateHabit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { category, frequency, notes } = req.body;
      const lifestyle = await lifestyleService.updateHabit(
        req.user!.userId,
        category,
        frequency,
        notes
      );
      res.json({ success: true, data: lifestyle });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete lifestyle (reset all habits)
   */
  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await lifestyleService.delete(req.user!.userId);
      res.json({ success: true, message: 'Lifestyle deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const lifestyleController = new LifestyleController();
