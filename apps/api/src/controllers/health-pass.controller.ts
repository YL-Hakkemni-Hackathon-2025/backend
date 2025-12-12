import { Response, NextFunction, Request } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { healthPassService } from '@hakkemni/services';

export class HealthPassController {
  async accessByCode(req: Request, res: Response, next: NextFunction) {
    try {
      const preview = await healthPassService.findByAccessCode(req.params.accessCode);
      res.json({ success: true, data: preview });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const healthPass = await healthPassService.create(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: healthPass });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const passes = await healthPassService.findByUserId(req.user!.userId);
      res.json({ success: true, data: passes });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const healthPass = await healthPassService.findById(req.params.id);
      res.json({ success: true, data: healthPass });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const healthPass = await healthPassService.update(req.params.id, req.body);
      res.json({ success: true, data: healthPass });
    } catch (error) {
      next(error);
    }
  }

  async regenerateQr(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const qrCode = await healthPassService.regenerateQrCode(req.params.id);
      res.json({ success: true, data: { qrCode } });
    } catch (error) {
      next(error);
    }
  }
}

export const healthPassController = new HealthPassController();
