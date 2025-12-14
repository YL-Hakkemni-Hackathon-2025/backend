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
}

export const autocompleteController = new AutocompleteController();

