import {
  parseTimeToMinutes,
  isRestaurantOpen,
  parseRestaurantSearchFilters,
  parseMenuSearchFilters,
  buildRestaurantSort,
  buildMenuSort,
  sortRestaurantsInMemory,
} from '../../../src/utils/search.utils';
import { IOperatingHours } from '../../../src/types/restaurant.types';

describe('search.utils', () => {
  const operatingHours: IOperatingHours = {
    monday: { open: '09:00', close: '22:00' },
    tuesday: { open: '09:00', close: '22:00' },
    wednesday: { open: '09:00', close: '22:00' },
    thursday: { open: '09:00', close: '22:00' },
    friday: { open: '09:00', close: '23:00' },
    saturday: { open: '10:00', close: '23:00' },
    sunday: { open: '10:00', close: '21:00' },
  };

  describe('parseTimeToMinutes', () => {
    it('converts HH:MM to minutes', () => {
      expect(parseTimeToMinutes('09:30')).toBe(570);
      expect(parseTimeToMinutes('22:00')).toBe(1320);
    });
  });

  describe('isRestaurantOpen', () => {
    it('returns true when current time is within operating hours', () => {
      const mondayNoon = new Date('2024-06-10T12:00:00');
      expect(isRestaurantOpen(operatingHours, mondayNoon)).toBe(true);
    });

    it('returns false when current time is outside operating hours', () => {
      const mondayEarly = new Date('2024-06-10T07:00:00');
      expect(isRestaurantOpen(operatingHours, mondayEarly)).toBe(false);
    });

    it('handles overnight hours that cross midnight', () => {
      const overnightHours: IOperatingHours = {
        ...operatingHours,
        friday: { open: '18:00', close: '02:00' },
      };
      const fridayNight = new Date('2024-06-14T23:00:00');
      const saturdayEarly = new Date('2024-06-15T01:00:00');
      const saturdayMorning = new Date('2024-06-15T08:00:00');

      expect(isRestaurantOpen(overnightHours, fridayNight)).toBe(true);
      expect(isRestaurantOpen(overnightHours, saturdayEarly)).toBe(true);
      expect(isRestaurantOpen(overnightHours, saturdayMorning)).toBe(false);
    });
  });

  describe('parseRestaurantSearchFilters', () => {
    it('parses restaurant search query parameters', () => {
      const filters = parseRestaurantSearchFilters({
        cuisine: 'italian',
        rating: '4',
        search: 'pizza',
        lat: '40.7128',
        lng: '-74.0060',
        maxDistance: '3000',
        isOpen: 'true',
        avgDeliveryTime: '45',
        minimumOrderValue: '15',
        sortBy: 'distance',
        sortOrder: 'asc',
      });

      expect(filters).toEqual({
        cuisine: 'italian',
        rating: 4,
        search: 'pizza',
        lat: 40.7128,
        lng: -74.006,
        maxDistance: 3000,
        isOpen: true,
        avgDeliveryTime: 45,
        minimumOrderValue: 15,
        sortBy: 'distance',
        sortOrder: 'asc',
      });
    });
  });

  describe('parseMenuSearchFilters', () => {
    it('parses menu search query parameters', () => {
      const filters = parseMenuSearchFilters({
        query: 'burger',
        category: 'mains',
        priceMin: '10',
        priceMax: '25',
        dietaryRestrictions: 'vegetarian',
        excludeAllergens: 'peanuts',
        minSpiceLevel: '1',
        maxSpiceLevel: '3',
        restaurantId: 'abc123',
        sortBy: 'popularity',
        sortOrder: 'desc',
      });

      expect(filters).toEqual({
        query: 'burger',
        category: 'mains',
        priceMin: 10,
        priceMax: 25,
        dietaryRestrictions: 'vegetarian',
        excludeAllergens: 'peanuts',
        minSpiceLevel: 1,
        maxSpiceLevel: 3,
        restaurantId: 'abc123',
        sortBy: 'popularity',
        sortOrder: 'desc',
      });
    });
  });

  describe('buildRestaurantSort', () => {
    it('builds sort options for restaurant queries', () => {
      expect(buildRestaurantSort('rating', 'desc')).toEqual({ rating: -1 });
      expect(buildRestaurantSort('distance', 'asc', true)).toEqual({ distance: 1 });
      expect(buildRestaurantSort('avgDeliveryTime', 'asc')).toEqual({ averageDeliveryTime: 1 });
    });
  });

  describe('buildMenuSort', () => {
    it('builds sort options for menu queries', () => {
      expect(buildMenuSort('price', 'asc')).toEqual({ price: 1 });
      expect(buildMenuSort('popularity', 'desc')).toEqual({ orderCount: -1 });
      expect(buildMenuSort('spiceLevel', 'desc')).toEqual({ spiceLevel: -1 });
    });
  });

  describe('sortRestaurantsInMemory', () => {
    it('sorts restaurants by rating descending', () => {
      const restaurants = [
        { name: 'A', rating: 3 },
        { name: 'B', rating: 5 },
        { name: 'C', rating: 4 },
      ];

      const sorted = sortRestaurantsInMemory(restaurants, 'rating', 'desc');
      expect(sorted.map((r) => r.name)).toEqual(['B', 'C', 'A']);
    });

    it('sorts restaurants by distance ascending', () => {
      const restaurants = [
        { name: 'A', distance: 500 },
        { name: 'B', distance: 100 },
        { name: 'C', distance: 300 },
      ];

      const sorted = sortRestaurantsInMemory(restaurants, 'distance', 'asc');
      expect(sorted.map((r) => r.name)).toEqual(['B', 'C', 'A']);
    });
  });
});
