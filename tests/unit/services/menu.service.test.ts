import MenuItem from '../../../src/models/menu.model';
import Restaurant from '../../../src/models/restaurant.model';
import { MenuService } from '../../../src/services/menu.service';

jest.mock('../../../src/models/menu.model');
jest.mock('../../../src/models/restaurant.model');

describe('MenuService', () => {
  let menuService: MenuService;

  const mockMenuItems = [
    {
      _id: '1',
      name: 'Veggie Bowl',
      price: 12,
      dietaryRestrictions: ['vegetarian', 'vegan'],
      allergens: ['soy'],
      spiceLevel: 1,
      orderCount: 150,
    },
    {
      _id: '2',
      name: 'Spicy Chicken',
      price: 18,
      dietaryRestrictions: [],
      allergens: ['eggs'],
      spiceLevel: 4,
      orderCount: 80,
    },
  ];

  beforeEach(() => {
    menuService = new MenuService();
    jest.clearAllMocks();
  });

  describe('searchMenuItemsWithFilters', () => {
    it('applies dietary, allergen, and spice level filters', async () => {
      const sortMock = jest.fn().mockResolvedValue([mockMenuItems[0]]);
      (MenuItem.find as jest.Mock).mockReturnValue({ sort: sortMock });

      const results = await menuService.searchMenuItemsWithFilters({
        dietaryRestrictions: ['vegetarian'],
        excludeAllergens: ['peanuts', 'eggs'],
        minSpiceLevel: 0,
        maxSpiceLevel: 2,
        sortBy: 'popularity',
        sortOrder: 'desc',
      });

      expect(MenuItem.find).toHaveBeenCalledWith({
        isAvailable: true,
        dietaryRestrictions: { $all: ['vegetarian'] },
        allergens: { $nin: ['peanuts', 'eggs'] },
        spiceLevel: { $gte: 0, $lte: 2 },
      });
      expect(sortMock).toHaveBeenCalledWith({ orderCount: -1 });
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Veggie Bowl');
    });

    it('applies price range and category filters', async () => {
      const sortMock = jest.fn().mockResolvedValue(mockMenuItems);
      (MenuItem.find as jest.Mock).mockReturnValue({ sort: sortMock });

      await menuService.searchMenuItemsWithFilters({
        category: 'mains',
        priceMin: 10,
        priceMax: 20,
        sortBy: 'price',
        sortOrder: 'asc',
      });

      expect(MenuItem.find).toHaveBeenCalledWith({
        isAvailable: true,
        category: 'mains',
        price: { $gte: 10, $lte: 20 },
      });
      expect(sortMock).toHaveBeenCalledWith({ price: 1 });
    });

    it('applies text search and restaurant filter', async () => {
      const sortMock = jest.fn().mockResolvedValue([mockMenuItems[1]]);
      (MenuItem.find as jest.Mock).mockReturnValue({ sort: sortMock });

      await menuService.searchMenuItemsWithFilters({
        query: 'chicken',
        restaurantId: 'restaurant123',
      });

      expect(MenuItem.find).toHaveBeenCalledWith({
        isAvailable: true,
        $text: { $search: 'chicken' },
        restaurantId: 'restaurant123',
      });
    });
  });
});
