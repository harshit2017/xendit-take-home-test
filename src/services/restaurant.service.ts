// src/services/restaurant.service.ts
import { PipelineStage } from 'mongoose';
import Restaurant from '../models/restaurant.model';
import MenuItem from '../models/menu.model';
import { IRestaurant } from '../types/restaurant.types';
import { RestaurantSearchFilters } from '../types/search.types';
import {
  IUpsertMenuLocalizationInput,
  IUpsertRestaurantLocalizationInput,
  SupportedLanguage,
} from '../types/localization.types';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import {
  buildRestaurantSort,
  isRestaurantOpen,
  sortRestaurantsInMemory,
  toArray,
} from '../utils/search.utils';
import {
  applyRestaurantLocalization,
} from '../utils/localization.utils';

export class RestaurantService {
  public async getAllRestaurants(
    query: Record<string, unknown> = {},
    locale?: SupportedLanguage
  ): Promise<IRestaurant[]> {
    return this.searchRestaurants(query, locale);
  }

  public async searchRestaurants(
    filters: RestaurantSearchFilters | Record<string, unknown> = {},
    locale?: SupportedLanguage
  ): Promise<IRestaurant[]> {
    const {
      cuisine,
      rating,
      search,
      lat,
      lng,
      maxDistance = 5000,
      avgDeliveryTime,
      minimumOrderValue,
      isOpen,
      sortBy,
      sortOrder = 'desc',
    } = filters as RestaurantSearchFilters;

    const baseFilter: Record<string, unknown> = { isActive: true };

    if (cuisine) {
      const cuisineList = toArray(cuisine as string | string[]);
      baseFilter.cuisine = { $in: cuisineList };
    }

    if (rating !== undefined) {
      baseFilter.rating = { $gte: Number(rating) };
    }

    if (avgDeliveryTime !== undefined) {
      baseFilter.averageDeliveryTime = { $eq: Number(avgDeliveryTime) };
    }

    if (minimumOrderValue !== undefined) {
      baseFilter.minimumOrderValue = { $eq: Number(minimumOrderValue) };
    }

    if (search) {
      baseFilter.$text = { $search: search };
    }

    const hasGeoQuery = lat !== undefined && lng !== undefined;
    type RestaurantResult = IRestaurant & { distance?: number };
    let restaurants: RestaurantResult[];

    if (hasGeoQuery) {
      const pipeline: PipelineStage[] = [
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
            distanceField: 'distance',
            maxDistance: Number(maxDistance),
            spherical: true,
            query: baseFilter,
          },
        },
      ];

      const sort = buildRestaurantSort(sortBy, sortOrder, true);
      if (sortBy) {
        pipeline.push({ $sort: sort });
      }

      restaurants = await Restaurant.aggregate<RestaurantResult>(pipeline);
    } else {
      const sort = buildRestaurantSort(sortBy, sortOrder, false);
      restaurants = await Restaurant.find(baseFilter).sort(sort).lean();
    }

    if (isOpen) {
      restaurants = restaurants.filter((restaurant) =>
        isRestaurantOpen(restaurant.operatingHours)
      );
    }

    if (hasGeoQuery && sortBy && sortBy !== 'distance') {
      restaurants = sortRestaurantsInMemory(restaurants, sortBy, sortOrder);
    }

    return restaurants.map((restaurant) =>
      locale ? applyRestaurantLocalization(restaurant, locale) : restaurant
    );
  }

  public async getRestaurantById(
    id: string,
    locale?: SupportedLanguage
  ): Promise<IRestaurant & { locale?: SupportedLanguage }> {
    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
      throw new NotFoundError('Restaurant not found');
    }

    return locale ? applyRestaurantLocalization(restaurant.toObject(), locale) : restaurant;
  }

  public async upsertRestaurantLocalization(
    id: string,
    userId: string,
    input: IUpsertRestaurantLocalizationInput
  ): Promise<IRestaurant> {
    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
      throw new NotFoundError('Restaurant not found');
    }

    if (restaurant.ownerId.toString() !== userId) {
      throw new ForbiddenError('You are not authorized to update this restaurant');
    }

    restaurant.localizations = {
      ...(restaurant.localizations ?? {}),
      [input.locale]: {
        ...(restaurant.localizations?.[input.locale] ?? {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
      },
    };

    await restaurant.save();
    return restaurant;
  }

  public async upsertMenuItemLocalization(
    restaurantId: string,
    menuItemId: string,
    userId: string,
    input: IUpsertMenuLocalizationInput
  ): Promise<IRestaurant> {
    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      throw new NotFoundError('Restaurant not found');
    }

    if (restaurant.ownerId.toString() !== userId) {
      throw new ForbiddenError('You are not authorized to update this restaurant');
    }

    const menuItem = await MenuItem.findOne({ _id: menuItemId, restaurantId });
    if (!menuItem) {
      throw new NotFoundError('Menu item not found for this restaurant');
    }

    const menuLocalizations = restaurant.menuLocalizations ?? [];
    const existingIndex = menuLocalizations.findIndex(
      (entry) => entry.menuItemId.toString() === menuItemId
    );

    const updatedEntry = {
      menuItemId,
      localizations: {
        ...(existingIndex >= 0 ? menuLocalizations[existingIndex].localizations : {}),
        [input.locale]: {
          ...(existingIndex >= 0
            ? menuLocalizations[existingIndex].localizations?.[input.locale]
            : {}),
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.category !== undefined ? { category: input.category } : {}),
        },
      },
    };

    if (existingIndex >= 0) {
      menuLocalizations[existingIndex] = updatedEntry;
    } else {
      menuLocalizations.push(updatedEntry);
    }

    restaurant.menuLocalizations = menuLocalizations;
    await restaurant.save();
    return restaurant;
  }
  
  public async createRestaurant(restaurantData: IRestaurant, userId: string): Promise<IRestaurant> {
    // Set the owner ID to the current user
    restaurantData.ownerId = userId;
    
    // Validate required fields
    if (!restaurantData.name || !restaurantData.description || !restaurantData.address) {
      throw new BadRequestError('Missing required restaurant information');
    }
    
    return Restaurant.create(restaurantData);
  }
  
  public async updateRestaurant(id: string, restaurantData: Partial<IRestaurant>, userId: string): Promise<IRestaurant> {
    const restaurant = await Restaurant.findById(id);
    
    if (!restaurant) {
      throw new NotFoundError('Restaurant not found');
    }
    
    // Check if the user is the owner of the restaurant
    if (restaurant.ownerId.toString() !== userId) {
      throw new ForbiddenError('You are not authorized to update this restaurant');
    }
    
    // Update the restaurant
    Object.assign(restaurant, restaurantData);
    await restaurant.save();
    
    return restaurant;
  }
  
  public async deleteRestaurant(id: string, userId: string): Promise<void> {
    const restaurant = await Restaurant.findById(id);
    
    if (!restaurant) {
      throw new NotFoundError('Restaurant not found');
    }
    
    // Check if the user is the owner of the restaurant
    if (restaurant.ownerId.toString() !== userId) {
      throw new ForbiddenError('You are not authorized to delete this restaurant');
    }
    
    await Restaurant.findByIdAndDelete(id);
  }
  
  public async getNearbyRestaurants(
    lat: number,
    lng: number,
    maxDistance: number = 5000,
    locale?: SupportedLanguage
  ): Promise<IRestaurant[]> {
    return this.searchRestaurants(
      { lat, lng, maxDistance, sortBy: 'distance', sortOrder: 'asc' },
      locale
    );
  }
}
