// src/utils/language.utils.ts
import { DEFAULT_LANGUAGE, SupportedLanguage } from '../types/localization.types';

const SUPPORTED_LANGUAGES = new Set(Object.values(SupportedLanguage));

const COUNTRY_LANGUAGE_MAP: Record<string, SupportedLanguage> = {
  US: SupportedLanguage.EN,
  GB: SupportedLanguage.EN,
  AU: SupportedLanguage.EN,
  IN: SupportedLanguage.HI,
  ID: SupportedLanguage.ID,
  ES: SupportedLanguage.ES,
  MX: SupportedLanguage.ES,
  FR: SupportedLanguage.FR,
  CN: SupportedLanguage.ZH,
  TW: SupportedLanguage.ZH,
};

export const normalizeLanguageCode = (code?: string): SupportedLanguage | null => {
  if (!code) {
    return null;
  }

  const normalized = code.trim().toLowerCase().split('-')[0];
  if (SUPPORTED_LANGUAGES.has(normalized as SupportedLanguage)) {
    return normalized as SupportedLanguage;
  }

  return null;
};

export const parseAcceptLanguage = (header?: string): SupportedLanguage | null => {
  if (!header) {
    return null;
  }

  const candidates = header
    .split(',')
    .map((part) => part.trim().split(';')[0])
    .map((code) => normalizeLanguageCode(code))
    .filter((code): code is SupportedLanguage => code !== null);

  return candidates[0] ?? null;
};

export const resolveLanguageFromCountry = (countryCode?: string): SupportedLanguage | null => {
  if (!countryCode) {
    return null;
  }

  return COUNTRY_LANGUAGE_MAP[countryCode.trim().toUpperCase()] ?? null;
};

export const resolveLanguage = (context: {
  explicitLanguage?: string;
  accountLanguage?: string;
  acceptLanguageHeader?: string;
  countryCode?: string;
}): SupportedLanguage => {
  return (
    normalizeLanguageCode(context.explicitLanguage) ??
    normalizeLanguageCode(context.accountLanguage) ??
    parseAcceptLanguage(context.acceptLanguageHeader) ??
    resolveLanguageFromCountry(context.countryCode) ??
    DEFAULT_LANGUAGE
  );
};
