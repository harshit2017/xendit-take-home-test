// src/routes/translation.routes.ts
import { Router } from 'express';
import { TranslationController } from '../controllers/translation.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../types/user.types';

const router = Router();
const translationController = new TranslationController();

router.get('/', translationController.getTranslations);

router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  translationController.upsertTranslation
);

export default router;
