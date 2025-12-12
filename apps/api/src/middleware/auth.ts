import { Request, Response, NextFunction } from 'express';
import { authService } from '@hakkemni/services';
import { UnauthorizedError } from '@hakkemni/common';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    fullName: string;
    governmentId: string;
  };
}

export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('No authorization header provided');
    }

    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedError('Invalid authorization format. Use: Bearer <token>');
    }

    const decoded = authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
}

export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const [bearer, token] = authHeader.split(' ');

      if (bearer === 'Bearer' && token) {
        const decoded = authService.verifyToken(token);
        req.user = decoded;
      }
    }
    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
}

