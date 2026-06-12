// src/types/i18n.types.ts
import { SupportedLanguage } from './localization.types';

export { SupportedLanguage, DEFAULT_LANGUAGE } from './localization.types';

export enum TranslationCategory {
  ERROR_MESSAGE = 'error_message',
  SUCCESS_MESSAGE = 'success_message',
  UI_LABEL = 'ui_label',
}

export interface ITranslation {
  _id?: string;
  category: TranslationCategory;
  key: string;
  locale: SupportedLanguage;
  value: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateTranslationInput {
  category: TranslationCategory;
  key: string;
  locale: SupportedLanguage;
  value: string;
}

export interface ILanguageResolutionContext {
  explicitLanguage?: string;
  accountLanguage?: string;
  acceptLanguageHeader?: string;
  countryCode?: string;
}
