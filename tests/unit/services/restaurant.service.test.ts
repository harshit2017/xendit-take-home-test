import Restaurant from '../../../src/models/restaurant.model';
import { RestaurantService } from '../../../src/services/restaurant.service';

jest.mock('../../../src/models/restaurant.model');

describe('RestaurantService', () => {
  let restaurantService: RestaurantService;

  const mockRestaurants = [
    {
      _id: '1',
      name: 'Open Bistro',
      rating: 4.5,
      averageDeliveryTime: 25,
      minimumOrderValue: 10,
      operatingHours: {
        monday: { open: '00:00', close: '23:59' },
        tuesday: { open: '00:00', close: '23:59' },
        wednesday: { open: '00:00', close: '23:59' },
        thursday: { open: '00:00', close: '23:59' },
        friday: { open: '00:00', close: '23:59' },
        saturday: { open: '00:00', close: '23:59' },
        sunday: { open: '00:00', close: '23:59' },
      },
      distance: 200,
    },
    {
      _id: '2',
      name: 'Closed Kitchen',
      rating: 4.0,
      averageDeliveryTime: 40,
      minimumOrderValue: 20,
      operatingHours: {
        monday: { open: '09:00', close: '10:00' },
        tuesday: { open: '09:00', close: '10:00' },
        wednesday: { open: '09:00', close: '10:00' },
        thursday: { open: '09:00', close: '10:00' },
        friday: { open: '09:00', close: '10:00' },
        saturday: { open: '09:00', close: '10:00' },
        sunday: { open: '09:00', close: '10:00' },
      },
      distance: 100,
    },
  ];

  beforeEach(() => {
    restaurantService = new RestaurantService();
    jest.clearAllMocks();
  });

  describe('searchRestaurants', () => {
    it('queries restaurants with delivery time and minimum order filters', async () => {
      const sortMock = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockRestaurants),
      });
      (Restaurant.find as jest.Mock).mockReturnValue({ sort: sortMock });

      const results = await restaurantService.searchRestaurants({
        avgDeliveryTime: 30,
        minimumOrderValue: 15,
        sortBy: 'rating',
        sortOrder: 'desc',
      });

      expect(Restaurant.find).toHaveBeenCalledWith({
        isActive: true,
        averageDeliveryTime: { $eq: 30 },
        minimumOrderValue: { $eq: 15 },
      });
      expect(sortMock).toHaveBeenCalledWith({ rating: -1 });
      expect(results).toHaveLength(2);
    });

    it('uses geospatial aggregation when lat and lng are provided', async () => {
      (Restaurant.aggregate as jest.Mock).mockResolvedValue(mockRestaurants);

      const results = await restaurantService.searchRestaurants({
        lat: 40.7128,
        lng: -74.006,
        maxDistance: 3000,
        sortBy: 'distance',
        sortOrder: 'asc',
      });

      expect(Restaurant.aggregate).toHaveBeenCalled();
      const pipeline = (Restaurant.aggregate as jest.Mock).mock.calls[0][0];
      expect(pipeline[0].$geoNear.near.coordinates).toEqual([-74.006, 40.7128]);
      expect(pipeline[0].$geoNear.maxDistance).toBe(3000);
      expect(results).toHaveLength(2);
    });

    it('filters to currently open restaurants when isOpen is true', async () => {
      const sortMock = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockRestaurants),
      });
      (Restaurant.find as jest.Mock).mockReturnValue({ sort: sortMock });

      const results = await restaurantService.searchRestaurants({ isOpen: true });

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Open Bistro');
    });

    it('applies text search filter', async () => {
      const sortMock = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockRestaurants[0]]),
      });
      (Restaurant.find as jest.Mock).mockReturnValue({ sort: sortMock });

      await restaurantService.searchRestaurants({ search: 'bistro' });

      expect(Restaurant.find).toHaveBeenCalledWith({
        isActive: true,
        $text: { $search: 'bistro' },
      });
    });
  });
});
