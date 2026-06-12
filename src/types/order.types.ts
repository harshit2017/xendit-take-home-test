// src/types/order.types.ts

export enum OrderStatus {
  SCHEDULED = 'scheduled',
  SCHEDULED_PROCESSING = 'scheduled_processing',
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export interface IOrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  customizations: Array<{
    name: string;
    option: string;
    price: number;
  }>;
}

export interface IOrder {
  _id?: string;
  customerId: string;
  restaurantId: string;
  deliveryPersonId?: string;
  items: IOrderItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  specialInstructions?: string;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  isScheduled?: boolean;
  scheduledFor?: Date;
  processingStartedAt?: Date;
  processedAt?: Date;
  upcomingNotificationSent?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateScheduledOrderInput {
  restaurantId: string;
  items: IOrderItem[];
  paymentMethod?: string;
  deliveryAddress?: IOrder['deliveryAddress'];
  specialInstructions?: string;
  scheduledFor: Date | string;
}

export interface IUpdateScheduledOrderInput {
  scheduledFor?: Date | string;
  items?: IOrderItem[];
  specialInstructions?: string;
  deliveryAddress?: IOrder['deliveryAddress'];
}
