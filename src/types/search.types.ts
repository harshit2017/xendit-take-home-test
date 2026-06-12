// src/types/search.types.ts

export type RestaurantSortField =
  | 'rating'
  | 'distance'
  | 'avgDeliveryTime'
  | 'minimumOrderValue'
  | 'name';

export type MenuSortField = 'price' | 'popularity' | 'name' | 'spiceLevel';

export type SortOrder = 'asc' | 'desc';

export interface RestaurantSearchFilters {
  cuisine?: string | string[];
  rating?: number;
  search?: string;
  lat?: number;
  lng?: number;
  maxDistance?: number;
  avgDeliveryTime?: number;
  minimumOrderValue?: number;
  sortBy?: RestaurantSortField;
  sortOrder?: SortOrder;
  isOpen?: boolean;
}

export interface MenuSearchFilters {
  query?: string;
  category?: string;
  priceMin?: number;
  priceMax?: number;
  dietaryRestrictions?: string | string[];
  excludeAllergens?: string | string[];
  minSpiceLevel?: number;
  maxSpiceLevel?: number;
  restaurantId?: string;
  sortBy?: MenuSortField;
  sortOrder?: SortOrder;
}
