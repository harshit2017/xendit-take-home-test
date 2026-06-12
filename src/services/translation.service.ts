// src/services/translation.service.ts
import Translation from '../models/translation.model';
import { ICreateTranslationInput, ITranslation } from '../types/i18n.types';
import { DEFAULT_LANGUAGE, SupportedLanguage } from '../types/localization.types';

export class TranslationService {
  public async upsertTranslation(input: ICreateTranslationInput): Promise<ITranslation> {
    return Translation.findOneAndUpdate(
      {
        category: input.category,
        key: input.key,
        locale: input.locale,
      },
      input,
      { upsert: true, new: true }
    );
  }

  public async getMessagesForLocale(locale: SupportedLanguage): Promise<Record<string, string>> {
    const translations = await Translation.find({
      locale: { $in: [locale, DEFAULT_LANGUAGE] },
    }).sort({ category: 1, key: 1 });

    const messages: Record<string, string> = {};

    for (const translation of translations) {
      const messageKey = `${translation.category}.${translation.key}`;
      if (!messages[messageKey] || translation.locale === locale) {
        messages[messageKey] = translation.value;
      }
    }

    return messages;
  }
}

export const translationService = new TranslationService();
