// src/middlewares/language.middleware.ts
import { Request, Response, NextFunction } from 'express';
import User from '../models/user.model';
import { SupportedLanguage } from '../types/localization.types';
import { resolveLanguage } from '../utils/language.utils';

declare global {
  namespace Express {
    interface Request {
      language?: SupportedLanguage;
    }
  }
}

export const languageMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user?.userId
      ? await User.findById(req.user.userId).select('preferredLanguage address.country')
      : null;

    const explicitFromRequest =
      (req.headers['x-explicit-language'] as string | undefined) ||
      (req.query.lang as string | undefined);

    req.language = resolveLanguage({
      explicitLanguage: explicitFromRequest,
      accountLanguage: user?.preferredLanguage,
      acceptLanguageHeader: req.headers['accept-language'] as string | undefined,
      countryCode:
        (req.headers['x-country-code'] as string | undefined) ||
        user?.address?.country,
    });

    next();
  } catch (error) {
    next(error);
  }
};
