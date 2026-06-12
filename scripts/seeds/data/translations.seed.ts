import { TranslationCategory } from '@app-types/i18n.types';
import { SupportedLanguage } from '@app-types/localization.types';

export const seedTranslations = [
  {
    category: TranslationCategory.ERROR_MESSAGE,
    key: 'order.not_found',
    locale: SupportedLanguage.EN,
    value: 'Order not found',
  },
  {
    category: TranslationCategory.ERROR_MESSAGE,
    key: 'order.not_found',
    locale: SupportedLanguage.HI,
    value: 'ऑर्डर नहीं मिला',
  },
  {
    category: TranslationCategory.ERROR_MESSAGE,
    key: 'auth.invalid_credentials',
    locale: SupportedLanguage.EN,
    value: 'Invalid email or password',
  },
  {
    category: TranslationCategory.ERROR_MESSAGE,
    key: 'auth.invalid_credentials',
    locale: SupportedLanguage.HI,
    value: 'अमान्य ईमेल या पासवर्ड',
  },
  {
    category: TranslationCategory.SUCCESS_MESSAGE,
    key: 'order.created',
    locale: SupportedLanguage.EN,
    value: 'Order placed successfully',
  },
  {
    category: TranslationCategory.SUCCESS_MESSAGE,
    key: 'order.created',
    locale: SupportedLanguage.HI,
    value: 'ऑर्डर सफलतापूर्वक दर्ज हो गया',
  },
  {
    category: TranslationCategory.SUCCESS_MESSAGE,
    key: 'loyalty.points_earned',
    locale: SupportedLanguage.EN,
    value: 'You earned loyalty points on this order',
  },
  {
    category: TranslationCategory.SUCCESS_MESSAGE,
    key: 'loyalty.points_earned',
    locale: SupportedLanguage.HI,
    value: 'आपको इस ऑर्डर पर लॉयल्टी पॉइंट्स मिले',
  },
  {
    category: TranslationCategory.UI_LABEL,
    key: 'nav.home',
    locale: SupportedLanguage.EN,
    value: 'Home',
  },
  {
    category: TranslationCategory.UI_LABEL,
    key: 'nav.home',
    locale: SupportedLanguage.HI,
    value: 'होम',
  },
  {
    category: TranslationCategory.UI_LABEL,
    key: 'nav.orders',
    locale: SupportedLanguage.EN,
    value: 'My Orders',
  },
  {
    category: TranslationCategory.UI_LABEL,
    key: 'nav.orders',
    locale: SupportedLanguage.HI,
    value: 'मेरे ऑर्डर',
  },
] as const;
