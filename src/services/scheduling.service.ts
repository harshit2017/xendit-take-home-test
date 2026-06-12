// src/services/scheduling.service.ts
import Order from '../models/order.model';
import Restaurant from '../models/restaurant.model';
import MenuItem from '../models/menu.model';
import User from '../models/user.model';
import {
  IOrder,
  IOrderItem,
  ICreateScheduledOrderInput,
  IUpdateScheduledOrderInput,
  OrderStatus,
  PaymentStatus,
} from '../types/order.types';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import {
  validateScheduledTime,
  UPCOMING_NOTIFICATION_WINDOW_MS,
  PROCESSING_STALE_LOCK_MS,
} from '../utils/scheduling.utils';
import { notificationService } from './notification.service';
import { OrderService } from './order.service';
import { isRestaurantOpen } from '../utils/search.utils';

export class SchedulingService {
  public async createScheduledOrder(
    orderData: ICreateScheduledOrderInput,
    userId: string
  ): Promise<IOrder> {
    if (!orderData.restaurantId || !orderData.items?.length || !orderData.scheduledFor) {
      throw new BadRequestError('Missing required scheduled order information');
    }

    const scheduledFor = new Date(orderData.scheduledFor);
    const timeValidation = validateScheduledTime(scheduledFor);
    if (!timeValidation.valid) {
      throw new BadRequestError(timeValidation.reason!);
    }

    const restaurant = await Restaurant.findById(orderData.restaurantId);
    if (!restaurant) {
      throw new NotFoundError('Restaurant not found');
    }

    if (!isRestaurantOpen(restaurant.operatingHours, scheduledFor)) {
      throw new BadRequestError('Scheduled time must be within restaurant operating hours');
    }

    const { orderItems, subtotal } = await this.buildOrderItems(orderData.items);

    const deliveryFee = 2.99;
    const taxRate = 0.08;
    const tax = subtotal * taxRate;
    const total = subtotal + deliveryFee + tax;

    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return Order.create({
      customerId: userId,
      restaurantId: orderData.restaurantId,
      items: orderItems,
      subtotal,
      deliveryFee,
      tax,
      total,
      status: OrderStatus.SCHEDULED,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod: orderData.paymentMethod || 'credit_card',
      deliveryAddress: orderData.deliveryAddress || user.address,
      specialInstructions: orderData.specialInstructions,
      isScheduled: true,
      scheduledFor,
      upcomingNotificationSent: false,
    });
  }

  public async getScheduledOrders(userId: string, role: string): Promise<IOrder[]> {
    const filter: Record<string, unknown> = {
      isScheduled: true,
      status: { $ne: OrderStatus.CANCELLED },
    };

    if (role === 'customer') {
      filter.customerId = userId;
    } else if (role === 'restaurant') {
      const restaurants = await Restaurant.find({ ownerId: userId });
      filter.restaurantId = { $in: restaurants.map((r) => r._id) };
    } else if (role !== 'admin') {
      throw new ForbiddenError('You are not authorized to view scheduled orders');
    }

    return Order.find(filter).sort({ scheduledFor: 1 });
  }

  public async getScheduledOrderById(id: string, userId: string, role: string): Promise<IOrder> {
    const order = await Order.findById(id);

    if (!order || !order.isScheduled) {
      throw new NotFoundError('Scheduled order not found');
    }

    await this.assertScheduledOrderAccess(order, userId, role);
    return order;
  }

  public async updateScheduledOrder(
    id: string,
    updates: IUpdateScheduledOrderInput,
    userId: string
  ): Promise<IOrder> {
    const order = await Order.findById(id);

    if (!order || !order.isScheduled) {
      throw new NotFoundError('Scheduled order not found');
    }

    if (order.customerId.toString() !== userId) {
      throw new ForbiddenError('You are not authorized to update this scheduled order');
    }

    if (order.status !== OrderStatus.SCHEDULED) {
      throw new BadRequestError('Only orders with scheduled status can be modified');
    }

    if (updates.scheduledFor) {
      const scheduledFor = new Date(updates.scheduledFor);
      const timeValidation = validateScheduledTime(scheduledFor);
      if (!timeValidation.valid) {
        throw new BadRequestError(timeValidation.reason!);
      }

      const restaurant = await Restaurant.findById(order.restaurantId);
      if (!restaurant) {
        throw new NotFoundError('Restaurant not found');
      }

      if (!isRestaurantOpen(restaurant.operatingHours, scheduledFor)) {
        throw new BadRequestError('Scheduled time must be within restaurant operating hours');
      }

      order.scheduledFor = scheduledFor;
      order.upcomingNotificationSent = false;
    }

    if (updates.items?.length) {
      const { orderItems, subtotal } = await this.buildOrderItems(updates.items);
      const deliveryFee = order.deliveryFee;
      const tax = subtotal * 0.08;
      order.items = orderItems;
      order.subtotal = subtotal;
      order.tax = tax;
      order.total = subtotal + deliveryFee + tax;
    }

    if (updates.specialInstructions !== undefined) {
      order.specialInstructions = updates.specialInstructions;
    }

    if (updates.deliveryAddress) {
      order.deliveryAddress = updates.deliveryAddress;
    }

    await order.save();
    return order;
  }

  public async processDueScheduledOrders(now: Date = new Date()): Promise<number> {
    await this.releaseStaleProcessingLocks(now);

    const dueOrders = await Order.find({
      isScheduled: true,
      status: OrderStatus.SCHEDULED,
      scheduledFor: { $lte: now },
    }).select('_id');

    let processedCount = 0;

    for (const dueOrder of dueOrders) {
      const claimed = await Order.findOneAndUpdate(
        {
          _id: dueOrder._id,
          status: OrderStatus.SCHEDULED,
        },
        {
          $set: {
            status: OrderStatus.SCHEDULED_PROCESSING,
            processingStartedAt: now,
          },
        },
        { new: true }
      );

      if (!claimed) {
        continue;
      }

      try {
        claimed.status = OrderStatus.PENDING;
        claimed.processedAt = now;
        claimed.estimatedDeliveryTime = new Date(now.getTime() + 45 * 60000);
        await claimed.save();

        await notificationService.sendScheduledProcessed(
          claimed.customerId.toString(),
          claimed._id!.toString()
        );

        processedCount++;
      } catch {
        await Order.findOneAndUpdate(
          { _id: claimed._id, status: OrderStatus.SCHEDULED_PROCESSING },
          {
            $set: { status: OrderStatus.SCHEDULED },
            $unset: { processingStartedAt: 1 },
          }
        );
      }
    }

    return processedCount;
  }

  public async sendUpcomingNotifications(now: Date = new Date()): Promise<number> {
    const windowEnd = new Date(now.getTime() + UPCOMING_NOTIFICATION_WINDOW_MS);

    const upcomingOrders = await Order.find({
      isScheduled: true,
      status: OrderStatus.SCHEDULED,
      upcomingNotificationSent: false,
      scheduledFor: { $gt: now, $lte: windowEnd },
    });

    let sentCount = 0;

    for (const order of upcomingOrders) {
      const updated = await Order.findOneAndUpdate(
        {
          _id: order._id,
          upcomingNotificationSent: false,
        },
        { $set: { upcomingNotificationSent: true } },
        { new: true }
      );

      if (!updated) {
        continue;
      }

      await notificationService.sendScheduledReminder(
        updated.customerId.toString(),
        updated._id!.toString(),
        updated.scheduledFor!
      );

      sentCount++;
    }

    return sentCount;
  }

  private async releaseStaleProcessingLocks(now: Date): Promise<void> {
    const staleThreshold = new Date(now.getTime() - PROCESSING_STALE_LOCK_MS);

    await Order.updateMany(
      {
        isScheduled: true,
        status: OrderStatus.SCHEDULED_PROCESSING,
        processingStartedAt: { $lte: staleThreshold },
      },
      {
        $set: { status: OrderStatus.SCHEDULED },
        $unset: { processingStartedAt: 1 },
      }
    );
  }

  private async buildOrderItems(
    items: IOrderItem[]
  ): Promise<{ orderItems: IOrderItem[]; subtotal: number }> {
    let subtotal = 0;
    const orderItems: IOrderItem[] = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (!menuItem) {
        throw new NotFoundError(`Menu item ${item.menuItemId} not found`);
      }

      if (!menuItem.isAvailable) {
        throw new BadRequestError(`Menu item ${menuItem.name} is not available`);
      }

      let itemPrice = menuItem.price;
      const customizations = [];

      if (item.customizations?.length) {
        for (const customization of item.customizations) {
          const menuCustomization = menuItem.customizationOptions.find(
            (opt) => opt.name === customization.name
          );

          if (!menuCustomization) {
            throw new BadRequestError(`Invalid customization: ${customization.name}`);
          }

          const option = menuCustomization.options.find(
            (opt) => opt.name === customization.option
          );

          if (!option) {
            throw new BadRequestError(
              `Invalid option: ${customization.option} for ${customization.name}`
            );
          }

          itemPrice += option.price;
          customizations.push({
            name: customization.name,
            option: customization.option,
            price: option.price,
          });
        }
      }

      subtotal += itemPrice * item.quantity;

      orderItems.push({
        menuItemId: item.menuItemId,
        name: menuItem.name,
        quantity: item.quantity,
        price: itemPrice,
        customizations,
      });
    }

    return { orderItems, subtotal };
  }

  private async assertScheduledOrderAccess(
    order: IOrder,
    userId: string,
    role: string
  ): Promise<void> {
    if (role === 'customer' && order.customerId.toString() !== userId) {
      throw new ForbiddenError('You are not authorized to view this scheduled order');
    } else if (role === 'restaurant') {
      const restaurant = await Restaurant.findById(order.restaurantId);
      if (!restaurant || restaurant.ownerId.toString() !== userId) {
        throw new ForbiddenError('You are not authorized to view this scheduled order');
      }
    }
  }
}
