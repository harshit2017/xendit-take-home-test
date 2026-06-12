// src/controllers/loyalty.controller.ts
import { Request, Response, NextFunction } from 'express';
import { loyaltyService } from '../services/loyalty.service';
import { BadRequestError } from '../utils/errors';

export class LoyaltyController {
  public getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw new BadRequestError('User ID is required');
      }

      const summary = await loyaltyService.getLoyaltySummary(req.user.userId);

      res.status(200).json({
        status: 'success',
        data: { loyaltySummary: summary },
      });
    } catch (error) {
      next(error);
    }
  };

  public getTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw new BadRequestError('User ID is required');
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const transactions = await loyaltyService.getTransactions(req.user.userId, limit);

      res.status(200).json({
        status: 'success',
        results: transactions.length,
        data: { transactions },
      });
    } catch (error) {
      next(error);
    }
  };

  public getRewards = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rewards = await loyaltyService.getAvailableRewards();

      res.status(200).json({
        status: 'success',
        results: rewards.length,
        data: { rewards },
      });
    } catch (error) {
      next(error);
    }
  };

  public getTiers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tiers = await loyaltyService.getTiers();

      res.status(200).json({
        status: 'success',
        results: tiers.length,
        data: { tiers },
      });
    } catch (error) {
      next(error);
    }
  };

  public redeemReward = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw new BadRequestError('User ID is required');
      }

      const { rewardId, orderId } = req.body;
      if (!rewardId) {
        throw new BadRequestError('Reward ID is required');
      }

      const result = await loyaltyService.redeemReward(req.user.userId, { rewardId, orderId });

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
