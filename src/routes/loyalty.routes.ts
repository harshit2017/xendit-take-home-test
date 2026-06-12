// src/routes/loyalty.routes.ts
import { Router } from 'express';
import { LoyaltyController } from '../controllers/loyalty.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../types/user.types';

const router = Router();
const loyaltyController = new LoyaltyController();

router.get('/tiers', loyaltyController.getTiers);
router.get('/rewards', loyaltyController.getRewards);

router.get('/summary', authenticate, authorize(UserRole.CUSTOMER), loyaltyController.getSummary);
router.get('/transactions', authenticate, authorize(UserRole.CUSTOMER), loyaltyController.getTransactions);
router.post('/redeem', authenticate, authorize(UserRole.CUSTOMER), loyaltyController.redeemReward);

export default router;
