import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { medicationService } from '@hakkemni/services';

export class MedicationController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const medication = await medicationService.create(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: medication });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const activeOnly = req.query.activeOnly !== 'false';
      const medications = await medicationService.findByUserId(req.user!.userId, activeOnly);
      res.json({ success: true, data: medications });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const medication = await medicationService.findById(req.params.id);
      res.json({ success: true, data: medication });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const medication = await medicationService.update(req.params.id, req.body);
      res.json({ success: true, data: medication });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await medicationService.delete(req.params.id);
      res.json({ success: true, message: 'Medication deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const medicationController = new MedicationController();
