import {
  calculateDiscountAmount,
  calculatePointsFromOrderTotal,
  resolveTierForLifetimePoints,
} from '../../../src/utils/loyalty.utils';

describe('loyalty.utils', () => {
  const tiers = [
    { _id: '1', name: 'Bronze', slug: 'bronze', minLifetimePoints: 0, benefits: [], sortOrder: 1 },
    { _id: '2', name: 'Silver', slug: 'silver', minLifetimePoints: 500, benefits: [], sortOrder: 2 },
    { _id: '3', name: 'Gold', slug: 'gold', minLifetimePoints: 2000, benefits: [], sortOrder: 3 },
  ];

  it('calculates points from order total', () => {
    expect(calculatePointsFromOrderTotal(42.5)).toBe(42);
  });

  it('resolves highest eligible tier', () => {
    expect(resolveTierForLifetimePoints(tiers, 1200)?.slug).toBe('silver');
    expect(resolveTierForLifetimePoints(tiers, 5000)?.slug).toBe('gold');
  });

  it('calculates percentage and fixed discounts', () => {
    expect(calculateDiscountAmount(100, 'percentage', 10)).toBe(10);
    expect(calculateDiscountAmount(100, 'fixed', 5)).toBe(5);
    expect(calculateDiscountAmount(10, 'fixed', 5, 20)).toBe(0);
  });
});
