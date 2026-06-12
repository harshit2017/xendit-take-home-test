import Notification from '../../../src/models/notification.model';
import User from '../../../src/models/user.model';
import Order from '../../../src/models/order.model';
import Restaurant from '../../../src/models/restaurant.model';
import { NotificationService } from '../../../src/services/notification.service';
import {
  NotificationCategory,
  NotificationType,
  DEFAULT_NOTIFICATION_PREFERENCES,
  buildOrderResource,
} from '../../../src/types/notification.types';
import { OrderStatus } from '../../../src/types/order.types';

jest.mock('../../../src/models/notification.model');
jest.mock('../../../src/models/user.model');
jest.mock('../../../src/models/order.model');
jest.mock('../../../src/models/restaurant.model');

describe('NotificationService', () => {
  let service: NotificationService;
  const mockEmit = jest.fn();

  beforeEach(() => {
    service = new NotificationService();
    service.setSocketServer({
      to: jest.fn().mockReturnValue({ emit: mockEmit }),
    } as any);
    jest.clearAllMocks();
  });

  describe('sendNotification', () => {
    it('persists and emits a new notification', async () => {
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({
          notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES,
        }),
      });
      (Notification.findOne as jest.Mock).mockResolvedValue(null);
      (Notification.create as jest.Mock).mockResolvedValue({
        _id: 'notif1',
        userId: 'user1',
        type: NotificationType.ORDER_STATUS_CHANGE,
        message: 'test',
        idempotencyKey: 'key1',
        read: false,
      });

      const result = await service.sendNotification({
        userId: 'user1',
        category: NotificationCategory.ORDER,
        type: NotificationType.ORDER_STATUS_CHANGE,
        message: 'test',
        resource: buildOrderResource('order1'),
        idempotencyKey: 'key1',
      });

      expect(Notification.create).toHaveBeenCalledTimes(1);
      expect(mockEmit).toHaveBeenCalledWith('notification', expect.objectContaining({ _id: 'notif1' }));
      expect(result._id).toBe('notif1');
    });

    it('returns existing notification for duplicate idempotency key', async () => {
      const existing = {
        _id: 'notif1',
        userId: 'user1',
        idempotencyKey: 'key1',
      };

      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({
          notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES,
        }),
      });
      (Notification.findOne as jest.Mock).mockResolvedValue(existing);

      const result = await service.sendNotification({
        userId: 'user1',
        category: NotificationCategory.ORDER,
        type: NotificationType.ORDER_STATUS_CHANGE,
        message: 'test',
        resource: buildOrderResource('order1'),
        idempotencyKey: 'key1',
      });

      expect(Notification.create).not.toHaveBeenCalled();
      expect(result).toBe(existing);
    });

    it('skips persistence when user disabled notification type', async () => {
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({
          notificationPreferences: {
            ...DEFAULT_NOTIFICATION_PREFERENCES,
            order: { ...DEFAULT_NOTIFICATION_PREFERENCES.order, statusUpdates: false },
          },
        }),
      });

      const result = await service.sendNotification({
        userId: 'user1',
        category: NotificationCategory.ORDER,
        type: NotificationType.ORDER_STATUS_CHANGE,
        message: 'test',
        resource: buildOrderResource('order1'),
        idempotencyKey: 'key1',
      });

      expect(Notification.create).not.toHaveBeenCalled();
      expect(mockEmit).not.toHaveBeenCalled();
      expect(result.read).toBe(true);
    });
  });

  describe('sendOrderStatusNotification', () => {
    it('uses idempotent key based on order and status', async () => {
      const sendSpy = jest.spyOn(service, 'sendNotification').mockResolvedValue({} as any);

      await service.sendOrderStatusNotification(
        'user1',
        'order1',
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED
      );

      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          idempotencyKey: 'order:status:order1:confirmed',
          type: NotificationType.ORDER_STATUS_CHANGE,
        })
      );
      expect(mockEmit).toHaveBeenCalledWith(
        'order:status',
        expect.objectContaining({
          orderId: 'order1',
          previousStatus: OrderStatus.PENDING,
          newStatus: OrderStatus.CONFIRMED,
        })
      );
    });
  });

  describe('sendRestaurantMessage', () => {
    it('sends message to order customer when restaurant owns order', async () => {
      (Order.findById as jest.Mock).mockResolvedValue({
        _id: 'order1',
        customerId: 'customer1',
        restaurantId: 'rest1',
      });
      (Restaurant.findById as jest.Mock).mockResolvedValue({
        _id: 'rest1',
        ownerId: 'owner1',
      });

      const sendSpy = jest.spyOn(service, 'sendNotification').mockResolvedValue({} as any);

      await service.sendRestaurantMessage('owner1', 'order1', 'Your order is ready soon');

      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'customer1',
          type: NotificationType.RESTAURANT_MESSAGE,
        })
      );
    });
  });

  describe('emitDeliveryLocation', () => {
    it('emits location updates without persisting', async () => {
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({
          notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES,
        }),
      });

      const timestamp = new Date();
      await service.emitDeliveryLocation(
        'order1',
        { orderId: 'order1', latitude: 1.23, longitude: 4.56, timestamp },
        'customer1'
      );

      expect(Notification.create).not.toHaveBeenCalled();
      expect(mockEmit).toHaveBeenCalledTimes(1);
      expect(mockEmit).toHaveBeenCalledWith(
        'delivery:location',
        expect.objectContaining({
          orderId: 'order1',
          location: { latitude: 1.23, longitude: 4.56, timestamp },
        })
      );
    });
  });

  describe('preferences', () => {
    it('updates user notification preferences', async () => {
      const save = jest.fn().mockResolvedValue(true);
      (User.findById as jest.Mock).mockResolvedValue({
        notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES,
        save,
      });

      const result = await service.updatePreferences('user1', {
        order: { ...DEFAULT_NOTIFICATION_PREFERENCES.order, deliveryTracking: false },
      });

      expect(save).toHaveBeenCalled();
      expect(result.order.deliveryTracking).toBe(false);
    });
  });
});
