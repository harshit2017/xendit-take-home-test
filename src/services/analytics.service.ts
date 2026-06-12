// src/services/analytics.service.ts
import Order from '../models/order.model';
import Restaurant from '../models/restaurant.model';
import {
  AnalyticsExportFormat,
  AnalyticsPeriod,
  IAnalyticsDashboard,
  ICustomerRetention,
  IDeliveryPerformance,
  IPeakOrderingTime,
  IPopularMenuItem,
  ISalesAggregation,
} from '../types/analytics.types';
import { OrderStatus } from '../types/order.types';
import { ForbiddenError } from '../utils/errors';

const PERIOD_FORMAT: Record<AnalyticsPeriod, string> = {
  day: '%Y-%m-%d',
  week: '%Y-W%V',
  month: '%Y-%m',
};

export class AnalyticsService {
  public async getDashboard(
    userId: string,
    role: string,
    restaurantId?: string,
    period: AnalyticsPeriod = 'day',
    from?: Date,
    to?: Date
  ): Promise<IAnalyticsDashboard> {
    const restaurantFilter = await this.resolveRestaurantFilter(userId, role, restaurantId);
    const dateRange = this.resolveDateRange(from, to);

    const [sales, popularMenuItems, peakOrderingTimes, deliveryPerformance, customerRetention, orderStats] =
      await Promise.all([
        this.getSalesAggregation(restaurantFilter, period, dateRange),
        this.getPopularMenuItems(restaurantFilter, dateRange),
        this.getPeakOrderingTimes(restaurantFilter, dateRange),
        this.getDeliveryPerformance(restaurantFilter, dateRange),
        this.getCustomerRetention(restaurantFilter, dateRange),
        this.getOrderStats(restaurantFilter, dateRange),
      ]);

    return {
      sales,
      averageOrderValue: orderStats.averageOrderValue,
      orderFrequency: orderStats.orderFrequency,
      customerRetention,
      popularMenuItems,
      peakOrderingTimes,
      deliveryPerformance,
    };
  }

  public async exportData(
    userId: string,
    role: string,
    format: AnalyticsExportFormat,
    restaurantId?: string,
    period: AnalyticsPeriod = 'day',
    from?: Date,
    to?: Date
  ): Promise<string> {
    const dashboard = await this.getDashboard(userId, role, restaurantId, period, from, to);

    if (format === 'csv') {
      const rows = [
        'period,orderCount,totalRevenue,averageOrderValue',
        ...dashboard.sales.map(
          (row) => `${row.period},${row.orderCount},${row.totalRevenue},${row.averageOrderValue}`
        ),
      ];
      return rows.join('\n');
    }

    return JSON.stringify(dashboard, null, 2);
  }

  private async resolveRestaurantFilter(
    userId: string,
    role: string,
    restaurantId?: string
  ): Promise<Record<string, unknown>> {
    if (role === 'admin') {
      return restaurantId ? { restaurantId } : {};
    }

    if (role === 'restaurant') {
      const restaurants = await Restaurant.find({ ownerId: userId }).select('_id');
      const restaurantIds = restaurants.map((r) => r._id);

      if (restaurantId) {
        const allowed = restaurantIds.some((id) => id.toString() === restaurantId);
        if (!allowed) {
          throw new ForbiddenError('You are not authorized to view analytics for this restaurant');
        }
        return { restaurantId };
      }

      return { restaurantId: { $in: restaurantIds } };
    }

    throw new ForbiddenError('You are not authorized to view analytics');
  }

  private resolveDateRange(from?: Date, to?: Date): { from: Date; to: Date } {
    const toDate = to ?? new Date();
    const fromDate = from ?? new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { from: fromDate, to: toDate };
  }

  private baseMatch(
    restaurantFilter: Record<string, unknown>,
    dateRange: { from: Date; to: Date }
  ): Record<string, unknown> {
    return {
      ...restaurantFilter,
      status: { $in: [OrderStatus.DELIVERED, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.PREPARING, OrderStatus.CONFIRMED] },
      createdAt: { $gte: dateRange.from, $lte: dateRange.to },
    };
  }

  private async getSalesAggregation(
    restaurantFilter: Record<string, unknown>,
    period: AnalyticsPeriod,
    dateRange: { from: Date; to: Date }
  ): Promise<ISalesAggregation[]> {
    const results = await Order.aggregate([
      { $match: this.baseMatch(restaurantFilter, dateRange) },
      {
        $group: {
          _id: { $dateToString: { format: PERIOD_FORMAT[period], date: '$createdAt' } },
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return results.map((row) => ({
      period: row._id,
      orderCount: row.orderCount,
      totalRevenue: row.totalRevenue,
      averageOrderValue: row.orderCount > 0 ? row.totalRevenue / row.orderCount : 0,
    }));
  }

  private async getOrderStats(
    restaurantFilter: Record<string, unknown>,
    dateRange: { from: Date; to: Date }
  ): Promise<{ averageOrderValue: number; orderFrequency: number }> {
    const [stats] = await Order.aggregate([
      { $match: this.baseMatch(restaurantFilter, dateRange) },
      {
        $group: {
          _id: null,
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          uniqueCustomers: { $addToSet: '$customerId' },
        },
      },
    ]);

    if (!stats) {
      return { averageOrderValue: 0, orderFrequency: 0 };
    }

    const uniqueCustomerCount = stats.uniqueCustomers.length;
    return {
      averageOrderValue: stats.orderCount > 0 ? stats.totalRevenue / stats.orderCount : 0,
      orderFrequency: uniqueCustomerCount > 0 ? stats.orderCount / uniqueCustomerCount : 0,
    };
  }

  private async getPopularMenuItems(
    restaurantFilter: Record<string, unknown>,
    dateRange: { from: Date; to: Date }
  ): Promise<IPopularMenuItem[]> {
    const results = await Order.aggregate([
      { $match: this.baseMatch(restaurantFilter, dateRange) },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItemId',
          name: { $first: '$items.name' },
          orderCount: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { orderCount: -1 } },
      { $limit: 10 },
    ]);

    return results.map((row) => ({
      menuItemId: row._id.toString(),
      name: row.name,
      orderCount: row.orderCount,
      revenue: row.revenue,
    }));
  }

  private async getPeakOrderingTimes(
    restaurantFilter: Record<string, unknown>,
    dateRange: { from: Date; to: Date }
  ): Promise<IPeakOrderingTime[]> {
    const results = await Order.aggregate([
      { $match: this.baseMatch(restaurantFilter, dateRange) },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return results.map((row) => ({
      hour: row._id,
      orderCount: row.orderCount,
    }));
  }

  private async getDeliveryPerformance(
    restaurantFilter: Record<string, unknown>,
    dateRange: { from: Date; to: Date }
  ): Promise<IDeliveryPerformance> {
    const deliveredMatch = {
      ...restaurantFilter,
      status: OrderStatus.DELIVERED,
      actualDeliveryTime: { $exists: true },
      estimatedDeliveryTime: { $exists: true },
      createdAt: { $gte: dateRange.from, $lte: dateRange.to },
    };

    const results = await Order.aggregate([
      { $match: deliveredMatch },
      {
        $project: {
          onTime: { $lte: ['$actualDeliveryTime', '$estimatedDeliveryTime'] },
          deliveryMinutes: {
            $divide: [{ $subtract: ['$actualDeliveryTime', '$createdAt'] }, 1000 * 60],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalDeliveries: { $sum: 1 },
          onTimeDeliveries: { $sum: { $cond: ['$onTime', 1, 0] } },
          averageDeliveryMinutes: { $avg: '$deliveryMinutes' },
        },
      },
    ]);

    const stats = results[0];
    if (!stats) {
      return {
        totalDeliveries: 0,
        onTimeDeliveries: 0,
        onTimeRate: 0,
        averageDeliveryMinutes: 0,
      };
    }

    return {
      totalDeliveries: stats.totalDeliveries,
      onTimeDeliveries: stats.onTimeDeliveries,
      onTimeRate: stats.totalDeliveries > 0 ? stats.onTimeDeliveries / stats.totalDeliveries : 0,
      averageDeliveryMinutes: stats.averageDeliveryMinutes ?? 0,
    };
  }

  private async getCustomerRetention(
    restaurantFilter: Record<string, unknown>,
    dateRange: { from: Date; to: Date }
  ): Promise<ICustomerRetention> {
    const midpoint = new Date((dateRange.from.getTime() + dateRange.to.getTime()) / 2);

    const [firstHalf, secondHalf] = await Promise.all([
      Order.distinct('customerId', {
        ...restaurantFilter,
        createdAt: { $gte: dateRange.from, $lt: midpoint },
      }),
      Order.distinct('customerId', {
        ...restaurantFilter,
        createdAt: { $gte: midpoint, $lte: dateRange.to },
      }),
    ]);

    const firstSet = new Set(firstHalf.map((id) => id.toString()));
    const returningCustomers = secondHalf.filter((id) => firstSet.has(id.toString())).length;

    return {
      totalCustomers: new Set([...firstHalf, ...secondHalf].map((id) => id.toString())).size,
      returningCustomers,
      retentionRate:
        firstSet.size > 0 ? returningCustomers / firstSet.size : 0,
    };
  }
}

export const analyticsService = new AnalyticsService();
