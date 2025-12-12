import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { documentService } from '@hakkemni/services';

export class DocumentController {
  async upload(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }

      const fileUrl = `uploads/${Date.now()}-${req.file.originalname}`;

      const result = await documentService.uploadAndProcess(
        req.user!.userId,
        {
          originalFileName: req.file.originalname,
          mimeType: req.file.mimetype,
          fileSize: req.file.size
        },
        fileUrl,
        req.file.buffer
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async confirm(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const document = await documentService.confirmDocument(req.params.id, req.body);
      res.json({ success: true, data: document });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const confirmedOnly = req.query.confirmedOnly !== 'false';
      const documents = await documentService.findByUserId(req.user!.userId, confirmedOnly);
      res.json({ success: true, data: documents });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const document = await documentService.findById(req.params.id);
      res.json({ success: true, data: document });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const document = await documentService.update(req.params.id, req.body);
      res.json({ success: true, data: document });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await documentService.delete(req.params.id);
      res.json({ success: true, message: 'Document deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const documentController = new DocumentController();
