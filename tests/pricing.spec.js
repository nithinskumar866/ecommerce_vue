import { describe, expect, it } from 'vitest';
import { calculateTotals, findCoupon, formatMoney } from '@/utils/pricing';

const lines = (rupees, quantity = 1) => [{ price: rupees * 100, quantity }];

describe('calculateTotals', () => {
  it('returns zeros for an empty cart', () => {
    expect(calculateTotals([])).toMatchObject({ subtotal: 0, shipping: 0, tax: 0, total: 0 });
  });

  it('charges standard delivery below the free threshold', () => {
    expect(calculateTotals(lines(500))).toMatchObject({ shipping: 4900, tax: 2500, total: 50000 + 4900 + 2500 });
  });

  it('makes standard delivery free at the threshold but never express', () => {
    expect(calculateTotals(lines(999)).shipping).toBe(0);
    expect(calculateTotals(lines(999), { deliveryId: 'express' }).shipping).toBe(14900);
  });

  it('caps a percentage coupon at its maximum and taxes the discounted amount', () => {
    const totals = calculateTotals(lines(85000), { coupon: findCoupon('welcome10') });
    expect(totals.discount).toBe(200000);
    expect(totals.tax).toBe(Math.round((8500000 - 200000) * 0.05));
    expect(totals.couponCode).toBe('WELCOME10');
  });

  it('ignores a coupon whose minimum subtotal is not met', () => {
    const totals = calculateTotals(lines(1000), { coupon: findCoupon('FLAT500') });
    expect(totals.discount).toBe(0);
    expect(totals.couponCode).toBeNull();
  });

  it('makes express delivery free with FREESHIP', () => {
    expect(calculateTotals(lines(100), { deliveryId: 'express', coupon: findCoupon('FREESHIP') }).shipping).toBe(0);
  });

  it('stays exact with amounts that drift in floating point', () => {
    expect(calculateTotals([{ price: 10, quantity: 3 }]).subtotal).toBe(30);
  });
});

describe('formatMoney', () => {
  it('uses Indian digit grouping and hides empty paise', () => {
    expect(formatMoney(8500000)).toBe('₹85,000');
    expect(formatMoney(1050)).toBe('₹10.50');
  });
});
