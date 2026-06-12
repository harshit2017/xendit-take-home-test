import Restaurant from '../../../src/models/restaurant.model';
import Order from '../../../src/models/order.model';
import { AnalyticsService } from '../../../src/services/analytics.service';

jest.mock('../../../src/models/restaurant.model');
jest.mock('../../../src/models/order.model');

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = new AnalyticsService();
    jest.clearAllMocks();
  });

  it('rejects analytics access for customers', async () => {
    await expect(service.getDashboard('user1', 'customer')).rejects.toThrow(
      'You are not authorized to view analytics'
    );
  });

  it('scopes restaurant owners to owned restaurants', async () => {
    (Restaurant.find as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue([{ _id: 'rest1' }]),
    });
    (Order.aggregate as jest.Mock).mockResolvedValue([]);
    (Order.distinct as jest.Mock).mockResolvedValue([]);

    await service.getDashboard('owner1', 'restaurant');

    expect(Restaurant.find).toHaveBeenCalledWith({ ownerId: 'owner1' });
  });
});
