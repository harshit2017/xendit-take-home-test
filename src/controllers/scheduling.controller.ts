// src/controllers/scheduling.controller.ts
import { Request, Response, NextFunction } from 'express';
import { SchedulingService } from '../services/scheduling.service';
import { BadRequestError } from '../utils/errors';

export class SchedulingController {
  private schedulingService: SchedulingService;

  constructor() {
    this.schedulingService = new SchedulingService();
  }

  public createScheduledOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw new BadRequestError('User ID is required');
      }

      const order = await this.schedulingService.createScheduledOrder(req.body, req.user.userId);

      res.status(201).json({
        status: 'success',
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  };

  public getScheduledOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId || !req.user?.role) {
        throw new BadRequestError('User ID and role are required');
      }

      const orders = await this.schedulingService.getScheduledOrders(req.user.userId, req.user.role);

      res.status(200).json({
        status: 'success',
        results: orders.length,
        data: { orders },
      });
    } catch (error) {
      next(error);
    }
  };

  public getScheduledOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId || !req.user?.role) {
        throw new BadRequestError('User ID and role are required');
      }

      const order = await this.schedulingService.getScheduledOrderById(
        req.params.id,
        req.user.userId,
        req.user.role
      );

      res.status(200).json({
        status: 'success',
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  };

  public updateScheduledOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw new BadRequestError('User ID is required');
      }

      const order = await this.schedulingService.updateScheduledOrder(
        req.params.id,
        req.body,
        req.user.userId
      );

      res.status(200).json({
        status: 'success',
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  };

}
