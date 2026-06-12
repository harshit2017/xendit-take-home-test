// src/types/analytics.types.ts

export type AnalyticsPeriod = 'day' | 'week' | 'month';

export type AnalyticsExportFormat = 'json' | 'csv';

export interface ISalesAggregation {
  period: string;
  orderCount: number;
  totalRevenue: number;
  averageOrderValue: number;
}

export interface IPopularMenuItem {
  menuItemId: string;
  name: string;
  orderCount: number;
  revenue: number;
}

export interface IPeakOrderingTime {
  hour: number;
  orderCount: number;
}

export interface IDeliveryPerformance {
  totalDeliveries: number;
  onTimeDeliveries: number;
  onTimeRate: number;
  averageDeliveryMinutes: number;
}

export interface ICustomerRetention {
  totalCustomers: number;
  returningCustomers: number;
  retentionRate: number;
}

export interface IAnalyticsDashboard {
  sales: ISalesAggregation[];
  averageOrderValue: number;
  orderFrequency: number;
  customerRetention: ICustomerRetention;
  popularMenuItems: IPopularMenuItem[];
  peakOrderingTimes: IPeakOrderingTime[];
  deliveryPerformance: IDeliveryPerformance;
}
