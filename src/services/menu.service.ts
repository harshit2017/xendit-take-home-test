// src/services/menu.service.ts
import MenuItem from '../models/menu.model';
import Restaurant from '../models/restaurant.model';
import { IMenuItem } from '../types/menu.types';
import { SupportedLanguage } from '../types/localization.types';
import { MenuSearchFilters } from '../types/search.types';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { buildMenuSort, toArray } from '../utils/search.utils';
import { applyMenuItemLocalization, applyMenuItemsLocalization } from '../utils/localization.utils';

export class MenuService {
  public async getMenuItemsByRestaurant(
    restaurantId: string,
    locale?: SupportedLanguage
  ): Promise<IMenuItem[]> {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      throw new NotFoundError('Restaurant not found');
    }

    const menuItems = await MenuItem.find({ restaurantId, isAvailable: true }).lean();
    return locale
      ? applyMenuItemsLocalization(menuItems, restaurant.menuLocalizations, locale)
      : menuItems;
  }

  public async getMenuItemById(
    id: string,
    locale?: SupportedLanguage
  ): Promise<IMenuItem> {
    const menuItem = await MenuItem.findById(id).lean();

    if (!menuItem) {
      throw new NotFoundError('Menu item not found');
    }

    if (!locale) {
      return menuItem;
    }

    const restaurant = await Restaurant.findById(menuItem.restaurantId).select('menuLocalizations');
    return applyMenuItemLocalization(menuItem, restaurant?.menuLocalizations, locale);
  }
  
  public async createMenuItem(menuItemData: IMenuItem, userId: string): Promise<IMenuItem> {
    // Verify restaurant exists and user is the owner
    const restaurant = await Restaurant.findById(menuItemData.restaurantId);
    
    if (!restaurant) {
      throw new NotFoundError('Restaurant not found');
    }
    
    if (restaurant.ownerId.toString() !== userId) {
      throw new ForbiddenError('You are not authorized to add menu items to this restaurant');
    }
    
    // Validate required fields
    if (!menuItemData.name || !menuItemData.price || !menuItemData.category) {
      throw new BadRequestError('Missing required menu item information');
    }
    
    return MenuItem.create(menuItemData);
  }
  
  public async updateMenuItem(id: string, menuItemData: Partial<IMenuItem>, userId: string): Promise<IMenuItem> {
    const menuItem = await MenuItem.findById(id);
    
    if (!menuItem) {
      throw new NotFoundError('Menu item not found');
    }
    
    // Verify user is the restaurant owner
    const restaurant = await Restaurant.findById(menuItem.restaurantId);
    
    if (!restaurant) {
      throw new NotFoundError('Restaurant not found');
    }
    
    if (restaurant.ownerId.toString() !== userId) {
      throw new ForbiddenError('You are not authorized to update menu items for this restaurant');
    }
    
    // Update the menu item
    Object.assign(menuItem, menuItemData);
    await menuItem.save();
    
    return menuItem;
  }
  
  public async deleteMenuItem(id: string, userId: string): Promise<void> {
    const menuItem = await MenuItem.findById(id);
    
    if (!menuItem) {
      throw new NotFoundError('Menu item not found');
    }
    
    // Verify user is the restaurant owner
    const restaurant = await Restaurant.findById(menuItem.restaurantId);
    
    if (!restaurant) {
      throw new NotFoundError('Restaurant not found');
    }
    
    if (restaurant.ownerId.toString() !== userId) {
      throw new ForbiddenError('You are not authorized to delete menu items for this restaurant');
    }
    
    await MenuItem.findByIdAndDelete(id);
  }

  public async searchMenuItems(
    query: string | undefined,
    filters: MenuSearchFilters | Record<string, unknown> = {}
  ): Promise<IMenuItem[]> {
    const searchFilters: MenuSearchFilters = {
      ...filters,
      query: query ?? (filters as MenuSearchFilters).query,
    };

    return this.searchMenuItemsWithFilters(searchFilters);
  }

  public async searchMenuItemsWithFilters(filters: MenuSearchFilters): Promise<IMenuItem[]> {
    const {
      query,
      category,
      priceMin,
      priceMax,
      dietaryRestrictions,
      excludeAllergens,
      minSpiceLevel,
      maxSpiceLevel,
      restaurantId,
      sortBy,
      sortOrder = 'asc',
    } = filters;

    const searchQuery: Record<string, unknown> = { isAvailable: true };

    if (query) {
      searchQuery.$text = { $search: query };
    }

    if (category) {
      searchQuery.category = category;
    }

    if (restaurantId) {
      searchQuery.restaurantId = restaurantId;
    }

    if (priceMin !== undefined || priceMax !== undefined) {
      searchQuery.price = {};

      if (priceMin !== undefined) {
        (searchQuery.price as Record<string, number>).$gte = Number(priceMin);
      }

      if (priceMax !== undefined) {
        (searchQuery.price as Record<string, number>).$lte = Number(priceMax);
      }
    }

    const dietaryList = toArray(dietaryRestrictions);
    if (dietaryList?.length) {
      searchQuery.dietaryRestrictions = { $all: dietaryList };
    }

    const allergenList = toArray(excludeAllergens);
    if (allergenList?.length) {
      searchQuery.allergens = { $nin: allergenList };
    }

    if (minSpiceLevel !== undefined || maxSpiceLevel !== undefined) {
      searchQuery.spiceLevel = {};

      if (minSpiceLevel !== undefined) {
        (searchQuery.spiceLevel as Record<string, number>).$gte = Number(minSpiceLevel);
      }

      if (maxSpiceLevel !== undefined) {
        (searchQuery.spiceLevel as Record<string, number>).$lte = Number(maxSpiceLevel);
      }
    }

    const sort = buildMenuSort(sortBy, sortOrder);

    return MenuItem.find(searchQuery).sort(sort);
  }
}
