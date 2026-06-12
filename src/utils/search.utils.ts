// src/utils/search.utils.ts
import { IOperatingHours } from '../types/restaurant.types';
import {
  RestaurantSearchFilters,
  MenuSearchFilters,
  RestaurantSortField,
  MenuSortField,
  SortOrder,
} from '../types/search.types';

const DAY_NAMES: (keyof IOperatingHours)[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

export const parseTimeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const isRestaurantOpen = (
  operatingHours: IOperatingHours,
  date: Date = new Date()
): boolean => {
  const dayIndex = date.getDay();
  const dayName = DAY_NAMES[dayIndex];
  const hours = operatingHours[dayName];
  const currentMinutes = date.getHours() * 60 + date.getMinutes();

  const previousDayName = DAY_NAMES[(dayIndex + 6) % 7];
  const previousHours = operatingHours[previousDayName];
  if (previousHours?.open && previousHours?.close) {
    const previousOpenMinutes = parseTimeToMinutes(previousHours.open);
    const previousCloseMinutes = parseTimeToMinutes(previousHours.close);
    if (previousCloseMinutes < previousOpenMinutes && currentMinutes <= previousCloseMinutes) {
      return true;
    }
  }

  if (!hours?.open || !hours?.close) {
    return false;
  }

  const openMinutes = parseTimeToMinutes(hours.open);
  const closeMinutes = parseTimeToMinutes(hours.close);

  if (closeMinutes < openMinutes) {
    return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
  }

  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
};

export const toArray = (value: string | string[] | undefined): string[] | undefined => {
  if (value === undefined) {
    return undefined;
  }
  return Array.isArray(value) ? value : [value];
};

export const parseBoolean = (value: string | boolean | undefined): boolean | undefined => {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  return value === 'true';
};

export const parseRestaurantSearchFilters = (query: Record<string, unknown>): RestaurantSearchFilters => {
  const filters: RestaurantSearchFilters = {};

  if (query.cuisine) {
    filters.cuisine = query.cuisine as string | string[];
  }
  if (query.rating !== undefined) {
    filters.rating = Number(query.rating);
  }
  if (query.search) {
    filters.search = String(query.search);
  }
  if (query.lat !== undefined) {
    filters.lat = Number(query.lat);
  }
  if (query.lng !== undefined) {
    filters.lng = Number(query.lng);
  }
  if (query.maxDistance !== undefined) {
    filters.maxDistance = Number(query.maxDistance);
  }
  if (query.distance !== undefined) {
    filters.maxDistance = Number(query.distance);
  }
  if (query.isOpen !== undefined) {
    filters.isOpen = parseBoolean(query.isOpen as string | boolean);
  }
  if (query.avgDeliveryTime !== undefined) {
    filters.avgDeliveryTime = Number(query.avgDeliveryTime);
  }
  if (query.minimumOrderValue !== undefined) {
    filters.minimumOrderValue = Number(query.minimumOrderValue);
  }
  if (query.sortBy) {
    filters.sortBy = query.sortBy as RestaurantSortField;
  }
  if (query.sortOrder) {
    filters.sortOrder = query.sortOrder as SortOrder;
  }

  return filters;
};

export const parseMenuSearchFilters = (query: Record<string, unknown>): MenuSearchFilters => {
  const filters: MenuSearchFilters = {};

  if (query.query) {
    filters.query = String(query.query);
  }
  if (query.category) {
    filters.category = String(query.category);
  }
  if (query.priceMin !== undefined) {
    filters.priceMin = Number(query.priceMin);
  }
  if (query.priceMax !== undefined) {
    filters.priceMax = Number(query.priceMax);
  }
  if (query.dietaryRestrictions) {
    filters.dietaryRestrictions = query.dietaryRestrictions as string | string[];
  }
  if (query.excludeAllergens) {
    filters.excludeAllergens = query.excludeAllergens as string | string[];
  }
  if (query.minSpiceLevel !== undefined) {
    filters.minSpiceLevel = Number(query.minSpiceLevel);
  }
  if (query.maxSpiceLevel !== undefined) {
    filters.maxSpiceLevel = Number(query.maxSpiceLevel);
  }
  if (query.restaurantId) {
    filters.restaurantId = String(query.restaurantId);
  }
  if (query.sortBy) {
    filters.sortBy = query.sortBy as MenuSortField;
  }
  if (query.sortOrder) {
    filters.sortOrder = query.sortOrder as SortOrder;
  }

  return filters;
};

export const buildRestaurantSort = (
  sortBy?: RestaurantSortField,
  sortOrder: SortOrder = 'desc',
  hasGeoQuery = false
): Record<string, 1 | -1> => {
  const direction: 1 | -1 = sortOrder === 'asc' ? 1 : -1;

  switch (sortBy) {
    case 'distance':
      return hasGeoQuery ? { distance: direction } : { rating: -1 };
    case 'avgDeliveryTime':
      return { averageDeliveryTime: direction };
    case 'minimumOrderValue':
      return { minimumOrderValue: direction };
    case 'name':
      return { name: direction };
    case 'rating':
    default:
      return { rating: direction };
  }
};

export const buildMenuSort = (
  sortBy?: MenuSortField,
  sortOrder: SortOrder = 'asc'
): Record<string, 1 | -1> => {
  const direction: 1 | -1 = sortOrder === 'asc' ? 1 : -1;

  switch (sortBy) {
    case 'popularity':
      return { orderCount: direction === 1 ? 1 : -1 };
    case 'name':
      return { name: direction };
    case 'spiceLevel':
      return { spiceLevel: direction };
    case 'price':
    default:
      return { price: direction };
  }
};

export const sortRestaurantsInMemory = <T>(
  restaurants: T[],
  sortBy?: RestaurantSortField,
  sortOrder: SortOrder = 'desc'
): T[] => {
  const direction = sortOrder === 'asc' ? 1 : -1;

  return [...restaurants].sort((a, b) => {
    const aRecord = a as Record<string, string | number | undefined>;
    const bRecord = b as Record<string, string | number | undefined>;
    let aValue: string | number;
    let bValue: string | number;

    switch (sortBy) {
      case 'distance':
        aValue = (aRecord.distance as number) ?? 0;
        bValue = (bRecord.distance as number) ?? 0;
        break;
      case 'avgDeliveryTime':
        aValue = (aRecord.averageDeliveryTime as number) ?? 0;
        bValue = (bRecord.averageDeliveryTime as number) ?? 0;
        break;
      case 'minimumOrderValue':
        aValue = (aRecord.minimumOrderValue as number) ?? 0;
        bValue = (bRecord.minimumOrderValue as number) ?? 0;
        break;
      case 'name':
        aValue = (aRecord.name as string) ?? '';
        bValue = (bRecord.name as string) ?? '';
        break;
      case 'rating':
      default:
        aValue = (aRecord.rating as number) ?? 0;
        bValue = (bRecord.rating as number) ?? 0;
        break;
    }

    if (aValue < bValue) {
      return -1 * direction;
    }
    if (aValue > bValue) {
      return 1 * direction;
    }
    return 0;
  });
};
