import { Request, Response } from 'express';
import { HTTP_STATUS } from '../../shared/constants';

export class HealthController {
  static getHealth(_req: Request, res: Response): void {
    res.status(HTTP_STATUS.OK).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  }

  static getApiInfo(_req: Request, res: Response): void {
    res.status(HTTP_STATUS.OK).json({
      message: 'Ticket Trader API',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  }
}