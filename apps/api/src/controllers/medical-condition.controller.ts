import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { medicalConditionService } from '@hakkemni/services';

export class MedicalConditionController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const condition = await medicalConditionService.create(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: condition });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const activeOnly = req.query.activeOnly !== 'false';
      const conditions = await medicalConditionService.findByUserId(req.user!.userId, activeOnly);
      res.json({ success: true, data: conditions });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const condition = await medicalConditionService.findById(req.params.id);
      res.json({ success: true, data: condition });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const condition = await medicalConditionService.update(req.params.id, req.body);
      res.json({ success: true, data: condition });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await medicalConditionService.delete(req.params.id);
      res.json({ success: true, message: 'Medical condition deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const medicalConditionController = new MedicalConditionController();
