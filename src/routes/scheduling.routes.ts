// src/routes/scheduling.routes.ts
import { Router } from 'express';
import { SchedulingController } from '../controllers/scheduling.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../types/user.types';

const router = Router();
const schedulingController = new SchedulingController();

router.post(
  '/',
  authenticate,
  authorize(UserRole.CUSTOMER),
  schedulingController.createScheduledOrder
);

router.get(
  '/',
  authenticate,
  schedulingController.getScheduledOrders
);

router.get(
  '/:id',
  authenticate,
  schedulingController.getScheduledOrderById
);

router.put(
  '/:id',
  authenticate,
  authorize(UserRole.CUSTOMER),
  schedulingController.updateScheduledOrder
);

export default router;
