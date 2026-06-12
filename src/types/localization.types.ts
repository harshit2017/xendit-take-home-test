// src/types/localization.types.ts

export enum SupportedLanguage {
  EN = 'en',
  HI = 'hi',
  ID = 'id',
  ES = 'es',
  FR = 'fr',
  ZH = 'zh',
}

export const DEFAULT_LANGUAGE = SupportedLanguage.EN;

export interface ILocalizedContent {
  name?: string;
  description?: string;
  category?: string;
}

export type LocalizedContentMap = Partial<Record<SupportedLanguage, ILocalizedContent>>;

export interface IMenuItemLocalization {
  menuItemId: string;
  localizations: LocalizedContentMap;
}

export interface IUpsertRestaurantLocalizationInput {
  locale: SupportedLanguage;
  name?: string;
  description?: string;
}

export interface IUpsertMenuLocalizationInput {
  locale: SupportedLanguage;
  name?: string;
  description?: string;
  category?: string;
}
