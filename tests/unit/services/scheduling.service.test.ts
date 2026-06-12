import Order from '../../../src/models/order.model';
import Restaurant from '../../../src/models/restaurant.model';
import MenuItem from '../../../src/models/menu.model';
import User from '../../../src/models/user.model';
import { SchedulingService } from '../../../src/services/scheduling.service';
import { notificationService } from '../../../src/services/notification.service';
import { OrderStatus } from '../../../src/types/order.types';

jest.mock('../../../src/models/order.model');
jest.mock('../../../src/models/restaurant.model');
jest.mock('../../../src/models/menu.model');
jest.mock('../../../src/models/user.model');
jest.mock('../../../src/services/notification.service', () => ({
  notificationService: {
    sendScheduledProcessed: jest.fn().mockResolvedValue({}),
    sendScheduledReminder: jest.fn().mockResolvedValue({}),
  },
}));

const getValidScheduledTime = (hour = 12): Date => {
  const scheduledFor = new Date();
  scheduledFor.setDate(scheduledFor.getDate() + 2);
  scheduledFor.setHours(hour, 0, 0, 0);

  while (scheduledFor.getTime() <= Date.now() + 15 * 60 * 1000) {
    scheduledFor.setDate(scheduledFor.getDate() + 1);
  }

  return scheduledFor;
};

describe('SchedulingService', () => {
  let schedulingService: SchedulingService;
  const operatingHours = {
    monday: { open: '09:00', close: '22:00' },
    tuesday: { open: '09:00', close: '22:00' },
    wednesday: { open: '09:00', close: '22:00' },
    thursday: { open: '09:00', close: '22:00' },
    friday: { open: '09:00', close: '22:00' },
    saturday: { open: '09:00', close: '22:00' },
    sunday: { open: '09:00', close: '22:00' },
  };

  beforeEach(() => {
    schedulingService = new SchedulingService();
    jest.clearAllMocks();
  });

  describe('createScheduledOrder', () => {
    it('creates a scheduled order when time is valid and within operating hours', async () => {
      const scheduledFor = getValidScheduledTime(12);

      (Restaurant.findById as jest.Mock).mockResolvedValue({
        _id: 'rest1',
        operatingHours,
      });
      (MenuItem.findById as jest.Mock).mockResolvedValue({
        _id: 'item1',
        name: 'Burger',
        price: 10,
        isAvailable: true,
        customizationOptions: [],
      });
      (User.findById as jest.Mock).mockResolvedValue({
        _id: 'user1',
        address: { street: '1 Main', city: 'NYC', state: 'NY', zipCode: '10001', country: 'US' },
      });
      (Order.create as jest.Mock).mockResolvedValue({
        _id: 'order1',
        status: OrderStatus.SCHEDULED,
      });

      const result = await schedulingService.createScheduledOrder(
        {
          restaurantId: 'rest1',
          scheduledFor,
          items: [{ menuItemId: 'item1', name: 'Burger', quantity: 1, price: 10, customizations: [] }],
        },
        'user1'
      );

      expect(Order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'user1',
          restaurantId: 'rest1',
          status: OrderStatus.SCHEDULED,
          isScheduled: true,
          scheduledFor,
        })
      );
      expect(result._id).toBe('order1');
    });

    it('rejects scheduled time outside operating hours', async () => {
      const earlyMorning = getValidScheduledTime(7);

      (Restaurant.findById as jest.Mock).mockResolvedValue({
        _id: 'rest1',
        operatingHours,
      });

      await expect(
        schedulingService.createScheduledOrder(
          {
            restaurantId: 'rest1',
            scheduledFor: earlyMorning,
            items: [{ menuItemId: 'item1', name: 'Burger', quantity: 1, price: 10, customizations: [] }],
          },
          'user1'
        )
      ).rejects.toThrow('Scheduled time must be within restaurant operating hours');
    });
  });

  describe('processDueScheduledOrders', () => {
    it('processes due orders idempotently using atomic claim', async () => {
      const now = new Date('2030-06-10T12:00:00');

      (Order.updateMany as jest.Mock).mockResolvedValue({});
      (Order.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue([{ _id: 'order1' }, { _id: 'order2' }]),
      });

      const claimedOrder = {
        _id: 'order1',
        customerId: 'user1',
        save: jest.fn().mockResolvedValue(true),
      };

      (Order.findOneAndUpdate as jest.Mock)
        .mockResolvedValueOnce(claimedOrder)
        .mockResolvedValueOnce(null);

      const processed = await schedulingService.processDueScheduledOrders(now);

      expect(processed).toBe(1);
      expect(Order.findOneAndUpdate).toHaveBeenCalledTimes(2);
      expect(claimedOrder.save).toHaveBeenCalled();
      expect(notificationService.sendScheduledProcessed).toHaveBeenCalledTimes(1);
    });
  });

  describe('sendUpcomingNotifications', () => {
    it('sends reminder notifications only once per order', async () => {
      const now = new Date('2030-06-10T11:45:00');
      const scheduledFor = new Date('2030-06-10T12:00:00');

      (Order.find as jest.Mock).mockResolvedValue([
        { _id: 'order1', customerId: 'user1', scheduledFor },
      ]);
      (Order.findOneAndUpdate as jest.Mock).mockResolvedValue({
        _id: 'order1',
        customerId: 'user1',
        scheduledFor,
      });

      const sent = await schedulingService.sendUpcomingNotifications(now);

      expect(sent).toBe(1);
      expect(notificationService.sendScheduledReminder).toHaveBeenCalledTimes(1);
    });
  });

});
