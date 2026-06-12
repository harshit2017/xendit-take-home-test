// src/routes/notification.routes.ts
import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../types/user.types';

const router = Router();
const notificationController = new NotificationController();

router.get('/', authenticate, notificationController.getNotifications);

router.get('/preferences', authenticate, notificationController.getPreferences);

router.put('/preferences', authenticate, notificationController.updatePreferences);

router.patch('/read-all', authenticate, notificationController.markAllAsRead);

router.patch('/:id/read', authenticate, notificationController.markAsRead);

router.post(
  '/messages',
  authenticate,
  authorize(UserRole.RESTAURANT),
  notificationController.sendRestaurantMessage
);

export default router;
