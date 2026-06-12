// src/utils/localization.utils.ts
import {
  DEFAULT_LANGUAGE,
  ILocalizedContent,
  IMenuItemLocalization,
  LocalizedContentMap,
  SupportedLanguage,
} from '../types/localization.types';
import { IMenuItem } from '../types/menu.types';
import { IRestaurant } from '../types/restaurant.types';

export const getLocalizedField = (
  defaultValue: string | undefined,
  localizations: LocalizedContentMap | undefined,
  locale: SupportedLanguage,
  field: keyof ILocalizedContent
): string | undefined => {
  const localized =
    localizations?.[locale]?.[field] ?? localizations?.[DEFAULT_LANGUAGE]?.[field];
  return localized ?? defaultValue;
};

export const applyRestaurantLocalization = <T extends IRestaurant>(
  restaurant: T,
  locale: SupportedLanguage = DEFAULT_LANGUAGE
): T & { locale: SupportedLanguage } => {
  const localizations = restaurant.localizations;

  return {
    ...restaurant,
    name: getLocalizedField(restaurant.name, localizations, locale, 'name') ?? restaurant.name,
    description:
      getLocalizedField(restaurant.description, localizations, locale, 'description') ??
      restaurant.description,
    locale,
  };
};

export const applyMenuItemLocalization = <T extends IMenuItem>(
  menuItem: T,
  menuLocalizations: IMenuItemLocalization[] | undefined,
  locale: SupportedLanguage = DEFAULT_LANGUAGE
): T & { locale: SupportedLanguage } => {
  const entry = menuLocalizations?.find(
    (item) => item.menuItemId.toString() === menuItem._id?.toString()
  );
  const localizations = entry?.localizations;

  return {
    ...menuItem,
    name: getLocalizedField(menuItem.name, localizations, locale, 'name') ?? menuItem.name,
    description:
      getLocalizedField(menuItem.description, localizations, locale, 'description') ??
      menuItem.description,
    category:
      getLocalizedField(menuItem.category, localizations, locale, 'category') ?? menuItem.category,
    locale,
  };
};

export const applyMenuItemsLocalization = <T extends IMenuItem>(
  menuItems: T[],
  menuLocalizations: IMenuItemLocalization[] | undefined,
  locale: SupportedLanguage = DEFAULT_LANGUAGE
): Array<T & { locale: SupportedLanguage }> =>
  menuItems.map((item) => applyMenuItemLocalization(item, menuLocalizations, locale));
