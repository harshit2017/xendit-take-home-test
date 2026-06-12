import {
  applyMenuItemLocalization,
  applyRestaurantLocalization,
} from '../../../src/utils/localization.utils';
import { SupportedLanguage } from '../../../src/types/localization.types';

describe('localization.utils', () => {
  it('applies restaurant localizations with fallback', () => {
    const restaurant = {
      _id: 'rest1',
      name: 'Pizza Place',
      description: 'Best pizza',
      localizations: {
        id: { name: 'Tempat Pizza', description: 'Pizza terbaik' },
      },
    };

    const localized = applyRestaurantLocalization(restaurant as any, SupportedLanguage.ID);

    expect(localized.name).toBe('Tempat Pizza');
    expect(localized.description).toBe('Pizza terbaik');
  });

  it('applies menu localizations from restaurant embed', () => {
    const menuItem = {
      _id: 'item1',
      restaurantId: 'rest1',
      name: 'Margherita',
      description: 'Classic pizza',
      category: 'Pizza',
    };

    const localized = applyMenuItemLocalization(
      menuItem as any,
      [
        {
          menuItemId: 'item1',
          localizations: {
            id: { name: 'Pizza Margherita', description: 'Pizza klasik' },
          },
        },
      ],
      SupportedLanguage.ID
    );

    expect(localized.name).toBe('Pizza Margherita');
    expect(localized.description).toBe('Pizza klasik');
  });
});
