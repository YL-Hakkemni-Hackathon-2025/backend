import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { autocompleteService } from '@hakkemni/services';

export class AutocompleteController {
  /**
   * Get medical condition autocomplete suggestions
   */
  async getMedicalConditions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { query, limit, context } = req.query;

      const suggestions = await autocompleteService.getMedicalConditionSuggestions(
        query as string,
        limit ? parseInt(limit as string, 10) : 10,
        context as string | undefined
      );

      res.json({ success: true, data: suggestions });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get medication autocomplete suggestions
   */
  async getMedications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { query, limit, context } = req.query;

      const suggestions = await autocompleteService.getMedicationSuggestions(
        query as string,
        limit ? parseInt(limit as string, 10) : 10,
        context as string | undefined
      );

      res.json({ success: true, data: suggestions });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get allergy autocomplete suggestions
   */
  async getAllergies(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { query, limit, context } = req.query;

      const suggestions = await autocompleteService.getAllergySuggestions(
        query as string,
        limit ? parseInt(limit as string, 10) : 10,
        context as string | undefined
      );

      res.json({ success: true, data: suggestions });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Scan a medicine photo and extract medication information for form prefill
   */
  async scanMedicinePhoto(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const file = req.file;

      if (!file) {
        res.status(400).json({ success: false, error: 'No image file provided. Please upload an image.' });
        return;
      }

      const result = await autocompleteService.scanMedicinePhoto(
        file.buffer,
        file.mimetype
      );

      if (result.success) {
        res.json({ success: true, data: result.data });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      next(error);
    }
  }
}

export const autocompleteController = new AutocompleteController();

