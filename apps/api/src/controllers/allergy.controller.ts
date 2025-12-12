import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { allergyService } from '@hakkemni/services';

export class AllergyController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const allergy = await allergyService.create(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: allergy });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const activeOnly = req.query.activeOnly !== 'false';
      const allergies = await allergyService.findByUserId(req.user!.userId, activeOnly);
      res.json({ success: true, data: allergies });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const allergy = await allergyService.findById(req.params.id);
      res.json({ success: true, data: allergy });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const allergy = await allergyService.update(req.params.id, req.body);
      res.json({ success: true, data: allergy });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await allergyService.delete(req.params.id);
      res.json({ success: true, message: 'Allergy deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const allergyController = new AllergyController();
