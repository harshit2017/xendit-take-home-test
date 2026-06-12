// src/types/notification.types.ts

/** High-level bucket — drives preferences, filtering, and inbox grouping */
export enum NotificationCategory {
  ORDER = 'order',
  LOYALTY = 'loyalty',
  PROMOTION = 'promotion',
  SYSTEM = 'system',
  ACCOUNT = 'account',
}

/** Specific event within a category */
export enum NotificationType {
  ORDER_STATUS_CHANGE = 'order_status_change',
  RESTAURANT_MESSAGE = 'restaurant_message',
  SCHEDULED_ORDER_REMINDER = 'scheduled_order_reminder',
  SCHEDULED_ORDER_PROCESSED = 'scheduled_order_processed',
  LOYALTY_POINTS_EARNED = 'loyalty_points_earned',
}

export enum NotificationResourceType {
  ORDER = 'order',
}

export interface INotificationResource {
  type: NotificationResourceType;
  id: string;
}

export interface INotificationPreferences {
  order: {
    statusUpdates: boolean;
    deliveryTracking: boolean;
    restaurantMessages: boolean;
    scheduledReminders: boolean;
  };
  loyalty: {
    enabled: boolean;
  };
  promotion: {
    enabled: boolean;
  };
  system: {
    enabled: boolean;
  };
}

export const DEFAULT_NOTIFICATION_PREFERENCES: INotificationPreferences = {
  order: {
    statusUpdates: true,
    deliveryTracking: true,
    restaurantMessages: true,
    scheduledReminders: true,
  },
  loyalty: { enabled: true },
  promotion: { enabled: true },
  system: { enabled: true },
};

export interface INotification {
  _id?: string;
  userId: string;
  category: NotificationCategory;
  type: NotificationType;
  title?: string;
  message: string;
  resource?: INotificationResource;
  data?: Record<string, unknown>;
  idempotencyKey: string;
  read: boolean;
  readAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISendNotificationInput {
  userId: string;
  category: NotificationCategory;
  type: NotificationType;
  title?: string;
  message: string;
  resource?: INotificationResource;
  data?: Record<string, unknown>;
  idempotencyKey: string;
}

export interface IDeliveryLocationPayload {
  orderId: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
}

export const SOCKET_EVENTS = {
  NOTIFICATION: 'notification',
  ORDER_STATUS: 'order:status',
  DELIVERY_LOCATION: 'delivery:location',
  JOIN_ORDER: 'join:order',
} as const;

export const NOTIFICATION_TYPE_CATEGORY: Record<NotificationType, NotificationCategory> = {
  [NotificationType.ORDER_STATUS_CHANGE]: NotificationCategory.ORDER,
  [NotificationType.RESTAURANT_MESSAGE]: NotificationCategory.ORDER,
  [NotificationType.SCHEDULED_ORDER_REMINDER]: NotificationCategory.ORDER,
  [NotificationType.SCHEDULED_ORDER_PROCESSED]: NotificationCategory.ORDER,
  [NotificationType.LOYALTY_POINTS_EARNED]: NotificationCategory.LOYALTY,
};

export const buildOrderResource = (orderId: string): INotificationResource => ({
  type: NotificationResourceType.ORDER,
  id: orderId,
});
