// src/services/notification.service.ts
import { Server } from 'socket.io';
import Notification from '../models/notification.model';
import User from '../models/user.model';
import Order from '../models/order.model';
import Restaurant from '../models/restaurant.model';
import {
  INotification,
  INotificationPreferences,
  ISendNotificationInput,
  NotificationCategory,
  NotificationType,
  SOCKET_EVENTS,
  DEFAULT_NOTIFICATION_PREFERENCES,
  IDeliveryLocationPayload,
  NOTIFICATION_TYPE_CATEGORY,
  buildOrderResource,
} from '../types/notification.types';
import { OrderStatus } from '../types/order.types';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';

export class NotificationService {
  private io: Server | null = null;

  public setSocketServer(io: Server): void {
    this.io = io;
  }

  public async sendNotification(input: ISendNotificationInput): Promise<INotification> {
    const category = input.category ?? NOTIFICATION_TYPE_CATEGORY[input.type];
    const payload = { ...input, category };

    const enabled = await this.isNotificationEnabled(payload.userId, payload.type, payload.category);
    if (!enabled) {
      return this.buildSkippedNotification(payload);
    }

    const notification = await this.createIdempotentNotification(payload);
    this.emitToUser(payload.userId, SOCKET_EVENTS.NOTIFICATION, notification);
    return notification;
  }

  public async sendOrderStatusNotification(
    userId: string,
    orderId: string,
    previousStatus: OrderStatus,
    newStatus: OrderStatus
  ): Promise<INotification | null> {
    if (previousStatus === newStatus) {
      return null;
    }

    const message = `Your order status changed from ${previousStatus} to ${newStatus}.`;
    const notification = await this.sendNotification({
      userId,
      category: NotificationCategory.ORDER,
      type: NotificationType.ORDER_STATUS_CHANGE,
      title: 'Order status updated',
      message,
      resource: buildOrderResource(orderId),
      idempotencyKey: `order:status:${orderId}:${newStatus}`,
      data: { previousStatus, newStatus },
    });

    this.emitToUser(userId, SOCKET_EVENTS.ORDER_STATUS, {
      orderId,
      previousStatus,
      newStatus,
      message,
    });

    return notification;
  }

  public async sendScheduledReminder(
    userId: string,
    orderId: string,
    scheduledFor: Date
  ): Promise<INotification> {
    return this.sendNotification({
      userId,
      category: NotificationCategory.ORDER,
      type: NotificationType.SCHEDULED_ORDER_REMINDER,
      title: 'Scheduled order reminder',
      message: `Reminder: your order is scheduled for ${scheduledFor.toISOString()}.`,
      resource: buildOrderResource(orderId),
      idempotencyKey: `order:scheduled_reminder:${orderId}`,
      data: { scheduledFor: scheduledFor.toISOString() },
    });
  }

  public async sendScheduledProcessed(userId: string, orderId: string): Promise<INotification> {
    return this.sendNotification({
      userId,
      category: NotificationCategory.ORDER,
      type: NotificationType.SCHEDULED_ORDER_PROCESSED,
      title: 'Scheduled order processing',
      message: 'Your scheduled order is now being processed and will be delivered soon.',
      resource: buildOrderResource(orderId),
      idempotencyKey: `order:scheduled_processed:${orderId}`,
    });
  }

  public async sendRestaurantMessage(
    restaurantUserId: string,
    orderId: string,
    message: string,
    idempotencyKey?: string
  ): Promise<INotification> {
    if (!message?.trim()) {
      throw new BadRequestError('Message is required');
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    const restaurant = await Restaurant.findById(order.restaurantId);
    if (!restaurant || restaurant.ownerId.toString() !== restaurantUserId) {
      throw new ForbiddenError('You are not authorized to message this customer');
    }

    const key = idempotencyKey ?? `order:restaurant_msg:${orderId}:${restaurantUserId}:${Date.now()}`;

    return this.sendNotification({
      userId: order.customerId.toString(),
      category: NotificationCategory.ORDER,
      type: NotificationType.RESTAURANT_MESSAGE,
      title: 'Message from restaurant',
      message: message.trim(),
      resource: buildOrderResource(orderId),
      idempotencyKey: key,
      data: { restaurantId: order.restaurantId.toString() },
    });
  }

  public async emitDeliveryLocation(
    orderId: string,
    location: IDeliveryLocationPayload,
    customerId: string
  ): Promise<void> {
    const preferences = await this.getPreferences(customerId);
    if (!preferences.order.deliveryTracking) {
      return;
    }

    const payload = {
      orderId,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: location.timestamp,
      },
    };

    this.emitToOrder(orderId, SOCKET_EVENTS.DELIVERY_LOCATION, payload);
  }

  public async getNotificationsByUser(userId: string): Promise<INotification[]> {
    return Notification.find({ userId }).sort({ createdAt: -1 });
  }

  public async markAsRead(id: string, userId: string): Promise<INotification> {
    const notification = await Notification.findOne({ _id: id, userId });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    return notification;
  }

  public async markAllAsRead(userId: string): Promise<number> {
    const result = await Notification.updateMany({ userId, read: false }, {
      $set: { read: true, readAt: new Date() },
    });
    return result.modifiedCount ?? 0;
  }

  public async getPreferences(userId: string): Promise<INotificationPreferences> {
    const user = await User.findById(userId).select('notificationPreferences');
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.normalizePreferences(user.notificationPreferences);
  }

  public async updatePreferences(
    userId: string,
    preferences: Partial<INotificationPreferences>
  ): Promise<INotificationPreferences> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const current = this.normalizePreferences(user.notificationPreferences);
    user.notificationPreferences = {
      order: { ...current.order, ...preferences.order },
      loyalty: { ...current.loyalty, ...preferences.loyalty },
      promotion: { ...current.promotion, ...preferences.promotion },
      system: { ...current.system, ...preferences.system },
    };

    await user.save();
    return user.notificationPreferences;
  }

  private async createIdempotentNotification(input: ISendNotificationInput): Promise<INotification> {
    const existing = await Notification.findOne({ idempotencyKey: input.idempotencyKey });
    if (existing) {
      return existing;
    }

    try {
      return await Notification.create({
        userId: input.userId,
        category: input.category,
        type: input.type,
        title: input.title,
        message: input.message,
        resource: input.resource,
        data: input.data,
        idempotencyKey: input.idempotencyKey,
        read: false,
      });
    } catch (error: unknown) {
      if (this.isDuplicateKeyError(error)) {
        const duplicate = await Notification.findOne({ idempotencyKey: input.idempotencyKey });
        if (duplicate) {
          return duplicate;
        }
      }
      throw error;
    }
  }

  private buildSkippedNotification(input: ISendNotificationInput): INotification {
    return {
      userId: input.userId,
      category: input.category,
      type: input.type,
      title: input.title,
      message: input.message,
      resource: input.resource,
      data: input.data,
      idempotencyKey: input.idempotencyKey,
      read: true,
    };
  }

  private normalizePreferences(preferences?: Partial<INotificationPreferences>): INotificationPreferences {
    if (!preferences) {
      return DEFAULT_NOTIFICATION_PREFERENCES;
    }

    return {
      order: { ...DEFAULT_NOTIFICATION_PREFERENCES.order, ...preferences.order },
      loyalty: { ...DEFAULT_NOTIFICATION_PREFERENCES.loyalty, ...preferences.loyalty },
      promotion: { ...DEFAULT_NOTIFICATION_PREFERENCES.promotion, ...preferences.promotion },
      system: { ...DEFAULT_NOTIFICATION_PREFERENCES.system, ...preferences.system },
    };
  }

  private async isNotificationEnabled(
    userId: string,
    type: NotificationType,
    category: NotificationCategory
  ): Promise<boolean> {
    const preferences = await this.getPreferences(userId);

    switch (category) {
      case NotificationCategory.ORDER:
        switch (type) {
          case NotificationType.ORDER_STATUS_CHANGE:
            return preferences.order.statusUpdates;
          case NotificationType.RESTAURANT_MESSAGE:
            return preferences.order.restaurantMessages;
          case NotificationType.SCHEDULED_ORDER_REMINDER:
          case NotificationType.SCHEDULED_ORDER_PROCESSED:
            return preferences.order.scheduledReminders;
          default:
            return true;
        }
      case NotificationCategory.LOYALTY:
        return preferences.loyalty.enabled;
      case NotificationCategory.PROMOTION:
        return preferences.promotion.enabled;
      case NotificationCategory.SYSTEM:
      case NotificationCategory.ACCOUNT:
        return preferences.system.enabled;
      default:
        return true;
    }
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: number }).code === 11000
    );
  }

  private emitToUser(userId: string, event: string, data: unknown): void {
    this.io?.to(`user:${userId}`).emit(event, data);
  }

  private emitToOrder(orderId: string, event: string, data: unknown): void {
    this.io?.to(`order:${orderId}`).emit(event, data);
  }
}

export const notificationService = new NotificationService();
