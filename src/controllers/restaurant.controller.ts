// src/controllers/restaurant.controller.ts
import { Request, Response, NextFunction } from 'express';
import { RestaurantService } from '../services/restaurant.service';
import { BadRequestError } from '../utils/errors';
import { parseRestaurantSearchFilters } from '../utils/search.utils';

export class RestaurantController {
  private restaurantService: RestaurantService;

  constructor() {
    this.restaurantService = new RestaurantService();
  }

  public getAllRestaurants = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurants = await this.restaurantService.getAllRestaurants(req.query, req.language);
      
      res.status(200).json({
        status: 'success',
        results: restaurants.length,
        data: {
          restaurants
        }
      });
    } catch (error) {
      next(error);
    }
  };

  public getRestaurantById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const restaurant = await this.restaurantService.getRestaurantById(id, req.language);
      
      res.status(200).json({
        status: 'success',
        data: {
          restaurant
        }
      });
    } catch (error) {
      next(error);
    }
  };

  public createRestaurant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        throw new BadRequestError('User ID is required');
      }
      
      const restaurant = await this.restaurantService.createRestaurant(req.body, req.user.userId);
      
      res.status(201).json({
        status: 'success',
        data: {
          restaurant
        }
      });
    } catch (error) {
      next(error);
    }
  };

  public updateRestaurant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        throw new BadRequestError('User ID is required');
      }
      
      const { id } = req.params;
      const restaurant = await this.restaurantService.updateRestaurant(id, req.body, req.user.userId);
      
      res.status(200).json({
        status: 'success',
        data: {
          restaurant
        }
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteRestaurant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        throw new BadRequestError('User ID is required');
      }
      
      const { id } = req.params;
      await this.restaurantService.deleteRestaurant(id, req.user.userId);
      
      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  };

  public getNearbyRestaurants = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { lat, lng, distance } = req.query;
      
      if (!lat || !lng) {
        throw new BadRequestError('Latitude and longitude are required');
      }
      
      const restaurants = await this.restaurantService.getNearbyRestaurants(
        Number(lat),
        Number(lng),
        distance ? Number(distance) : undefined,
        req.language
      );
      
      res.status(200).json({
        status: 'success',
        results: restaurants.length,
        data: {
          restaurants
        }
      });
    } catch (error) {
      next(error);
    }
  };

  public searchRestaurants = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = parseRestaurantSearchFilters(req.query);
      const restaurants = await this.restaurantService.searchRestaurants(filters, req.language);

      res.status(200).json({
        status: 'success',
        results: restaurants.length,
        data: {
          restaurants
        }
      });
    } catch (error) {
      next(error);
    }
  };

  public upsertRestaurantLocalization = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw new BadRequestError('User ID is required');
      }

      const restaurant = await this.restaurantService.upsertRestaurantLocalization(
        req.params.id,
        req.user.userId,
        req.body
      );

      res.status(200).json({
        status: 'success',
        data: { restaurant },
      });
    } catch (error) {
      next(error);
    }
  };

  public upsertMenuItemLocalization = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw new BadRequestError('User ID is required');
      }

      const restaurant = await this.restaurantService.upsertMenuItemLocalization(
        req.params.id,
        req.params.menuItemId,
        req.user.userId,
        req.body
      );

      res.status(200).json({
        status: 'success',
        data: { restaurant },
      });
    } catch (error) {
      next(error);
    }
  };
}
