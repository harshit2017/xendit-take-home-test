// src/controllers/analytics.controller.ts
import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service';
import { AnalyticsExportFormat, AnalyticsPeriod } from '../types/analytics.types';
import { BadRequestError } from '../utils/errors';

export class AnalyticsController {
  public getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId || !req.user?.role) {
        throw new BadRequestError('User ID and role are required');
      }

      const period = (req.query.period as AnalyticsPeriod) || 'day';
      const restaurantId = req.query.restaurantId as string | undefined;
      const from = req.query.from ? new Date(req.query.from as string) : undefined;
      const to = req.query.to ? new Date(req.query.to as string) : undefined;

      const dashboard = await analyticsService.getDashboard(
        req.user.userId,
        req.user.role,
        restaurantId,
        period,
        from,
        to
      );

      res.status(200).json({
        status: 'success',
        data: { dashboard },
      });
    } catch (error) {
      next(error);
    }
  };

  public exportData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId || !req.user?.role) {
        throw new BadRequestError('User ID and role are required');
      }

      const format = (req.query.format as AnalyticsExportFormat) || 'json';
      const period = (req.query.period as AnalyticsPeriod) || 'day';
      const restaurantId = req.query.restaurantId as string | undefined;
      const from = req.query.from ? new Date(req.query.from as string) : undefined;
      const to = req.query.to ? new Date(req.query.to as string) : undefined;

      const exported = await analyticsService.exportData(
        req.user.userId,
        req.user.role,
        format,
        restaurantId,
        period,
        from,
        to
      );

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="analytics-export.csv"');
        res.status(200).send(exported);
        return;
      }

      res.status(200).json({
        status: 'success',
        data: JSON.parse(exported),
      });
    } catch (error) {
      next(error);
    }
  };
}
