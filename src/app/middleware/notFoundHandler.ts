import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS } from '../../shared/constants';

export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    error: {
      code: HTTP_STATUS.NOT_FOUND,
      message: `Route ${req.method} ${req.path} not found`,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    }
  });
}