// src/utils/loyalty.utils.ts
import { ILoyaltyTier } from '../types/loyalty.types';

export const POINTS_PER_CURRENCY_UNIT = 1;

export const DEFAULT_LOYALTY_POINT_EXPIRY_DAYS = 365;

export const calculatePointsFromOrderTotal = (orderTotal: number): number => {
  return Math.floor(Math.max(orderTotal, 0) * POINTS_PER_CURRENCY_UNIT);
};

export const resolveTierForLifetimePoints = (
  tiers: ILoyaltyTier[],
  lifetimePoints: number
): ILoyaltyTier | null => {
  const sorted = [...tiers].sort((a, b) => b.minLifetimePoints - a.minLifetimePoints);
  return sorted.find((tier) => lifetimePoints >= tier.minLifetimePoints) ?? null;
};

export const calculateDiscountAmount = (
  orderSubtotal: number,
  discountType: string,
  discountValue: number,
  minOrderValue = 0,
  maxDiscountAmount?: number
): number => {
  if (orderSubtotal < minOrderValue) {
    return 0;
  }

  let discount =
    discountType === 'percentage'
      ? (orderSubtotal * discountValue) / 100
      : discountValue;

  if (maxDiscountAmount !== undefined) {
    discount = Math.min(discount, maxDiscountAmount);
  }

  return Math.min(Math.max(discount, 0), orderSubtotal);
};
