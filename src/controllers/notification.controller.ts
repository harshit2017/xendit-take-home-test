// src/controllers/notification.controller.ts
import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';
import { BadRequestError } from '../utils/errors';

export class NotificationController {
  public getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw new BadRequestError('User ID is required');
      }

      const notifications = await notificationService.getNotificationsByUser(req.user.userId);

      res.status(200).json({
        status: 'success',
        results: notifications.length,
        data: { notifications },
      });
    } catch (error) {
      next(error);
    }
  };

  public markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw new BadRequestError('User ID is required');
      }

      const notification = await notificationService.markAsRead(req.params.id, req.user.userId);

      res.status(200).json({
        status: 'success',
        data: { notification },
      });
    } catch (error) {
      next(error);
    }
  };

  public markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw new BadRequestError('User ID is required');
      }

      const updatedCount = await notificationService.markAllAsRead(req.user.userId);

      res.status(200).json({
        status: 'success',
        data: { updatedCount },
      });
    } catch (error) {
      next(error);
    }
  };

  public getPreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw new BadRequestError('User ID is required');
      }

      const preferences = await notificationService.getPreferences(req.user.userId);

      res.status(200).json({
        status: 'success',
        data: { preferences },
      });
    } catch (error) {
      next(error);
    }
  };

  public updatePreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw new BadRequestError('User ID is required');
      }

      const preferences = await notificationService.updatePreferences(req.user.userId, req.body);

      res.status(200).json({
        status: 'success',
        data: { preferences },
      });
    } catch (error) {
      next(error);
    }
  };

  public sendRestaurantMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw new BadRequestError('User ID is required');
      }

      const { orderId, message, idempotencyKey } = req.body;

      if (!orderId) {
        throw new BadRequestError('Order ID is required');
      }

      const notification = await notificationService.sendRestaurantMessage(
        req.user.userId,
        orderId,
        message,
        idempotencyKey
      );

      res.status(201).json({
        status: 'success',
        data: { notification },
      });
    } catch (error) {
      next(error);
    }
  };
}
