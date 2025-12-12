import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { lifestyleService } from '@hakkemni/services';

export class LifestyleController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const lifestyle = await lifestyleService.create(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: lifestyle });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const activeOnly = req.query.activeOnly !== 'false';
      const lifestyles = await lifestyleService.findByUserId(req.user!.userId, activeOnly);
      res.json({ success: true, data: lifestyles });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const lifestyle = await lifestyleService.findById(req.params.id);
      res.json({ success: true, data: lifestyle });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const lifestyle = await lifestyleService.update(req.params.id, req.body);
      res.json({ success: true, data: lifestyle });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await lifestyleService.delete(req.params.id);
      res.json({ success: true, message: 'Lifestyle choice deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const lifestyleController = new LifestyleController();
