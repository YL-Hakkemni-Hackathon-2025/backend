import { Request, Response, NextFunction } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';

/**
 * Validation middleware factory that validates request body against a DTO class
 */
export function validateBody<T extends object>(DtoClass: new () => T) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dto = plainToInstance(DtoClass, req.body);
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: false
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: formatErrors(errors)
      });
    }

    req.body = dto;
    next();
  };
}

/**
 * Validation middleware factory for partial updates (PATCH requests)
 */
export function validateBodyPartial<T extends object>(DtoClass: new () => T) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dto = plainToInstance(DtoClass, req.body);
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: true // Allow missing properties for partial updates
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: formatErrors(errors)
      });
    }

    req.body = dto;
    next();
  };
}

/**
 * Validation middleware for route parameters
 */
export function validateParams<T extends object>(DtoClass: new () => T) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dto = plainToInstance(DtoClass, req.params);
    const errors = await validate(dto, {
      whitelist: true,
      skipMissingProperties: false
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parameters',
        errors: formatErrors(errors)
      });
    }

    req.params = dto as any;
    next();
  };
}

/**
 * Validation middleware for query parameters
 */
export function validateQuery<T extends object>(DtoClass: new () => T) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dto = plainToInstance(DtoClass, req.query);
    const errors = await validate(dto, {
      whitelist: true,
      skipMissingProperties: true
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: formatErrors(errors)
      });
    }

    req.query = dto as any;
    next();
  };
}

/**
 * Format validation errors into a readable structure
 */
function formatErrors(errors: ValidationError[]): Record<string, string[]> {
  const formattedErrors: Record<string, string[]> = {};

  for (const error of errors) {
    const property = error.property;
    const constraints = error.constraints;

    if (constraints) {
      formattedErrors[property] = Object.values(constraints);
    }

    // Handle nested validation errors
    if (error.children && error.children.length > 0) {
      const nestedErrors = formatErrors(error.children);
      for (const [key, value] of Object.entries(nestedErrors)) {
        formattedErrors[`${property}.${key}`] = value;
      }
    }
  }

  return formattedErrors;
}

