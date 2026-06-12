// src/controllers/translation.controller.ts
import { Request, Response, NextFunction } from 'express';
import { translationService } from '../services/translation.service';
import { SupportedLanguage } from '../types/localization.types';
import { BadRequestError } from '../utils/errors';

export class TranslationController {
  public getTranslations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const locale = req.language ?? SupportedLanguage.EN;
      const messages = await translationService.getMessagesForLocale(locale);

      res.status(200).json({
        status: 'success',
        data: { locale, messages },
      });
    } catch (error) {
      next(error);
    }
  };

  public upsertTranslation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { category, key, locale, value } = req.body;

      if (!category || !key || !locale || !value) {
        throw new BadRequestError('category, key, locale, and value are required');
      }

      const translation = await translationService.upsertTranslation({
        category,
        key,
        locale,
        value,
      });

      res.status(200).json({
        status: 'success',
        data: { translation },
      });
    } catch (error) {
      next(error);
    }
  };
}
