// src/routes/analytics.routes.ts
import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../types/user.types';

const router = Router();
const analyticsController = new AnalyticsController();

router.get(
  '/dashboard',
  authenticate,
  authorize(UserRole.RESTAURANT, UserRole.ADMIN),
  analyticsController.getDashboard
);

router.get(
  '/export',
  authenticate,
  authorize(UserRole.RESTAURANT, UserRole.ADMIN),
  analyticsController.exportData
);

export default router;
