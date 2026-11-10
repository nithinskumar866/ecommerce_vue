import { bundleSavings } from './deals';
import { POINT_VALUE_PAISE, pointsToUse } from './loyalty';

// All money at runtime is whole paise, so totals never hit floating-point drift.
const inr = (fractionDigits) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: fractionDigits,
  maximumFractionDigits: fractionDigits,
});
const whole = inr(0);
const exact = inr(2);
const compact = new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 1,
});

export function formatMoney(paise) {
  return (paise % 100 === 0 ? whole : exact).format(paise / 100);
}

export const formatCompactMoney = (paise) => compact.format(paise / 100);

export const TAX_PERCENT = 5;
export const FREE_DELIVERY_FROM = 99900;

export const deliveryOptions = [
  { id: 'standard', label: 'Standard delivery', eta: '3-5 business days', fee: 4900, freeAbove: FREE_DELIVERY_FROM },
  { id: 'express', label: 'Express delivery', eta: '1-2 business days', fee: 14900, freeAbove: null },
];

export const coupons = [
  { code: 'WELCOME10', label: '10% off, up to ₹2,000', type: 'percent', value: 10, maxDiscount: 200000, minSubtotal: 0 },
  { code: 'FLAT500', label: '₹500 off orders above ₹5,000', type: 'flat', value: 50000, minSubtotal: 500000 },
  { code: 'FREESHIP', label: 'Free delivery on any order', type: 'shipping', minSubtotal: 0 },
];

export function findCoupon(code) {
  const wanted = String(code ?? '').trim().toUpperCase();
  return coupons.find((coupon) => coupon.code === wanted) ?? null;
}

export function couponProblem(coupon, subtotal) {
  if (subtotal < coupon.minSubtotal) {
    return `${coupon.code} needs a subtotal of at least ${formatMoney(coupon.minSubtotal)}.`;
  }
  return null;
}

function discountFor(coupon, subtotal) {
  if (coupon?.type === 'percent') {
    return Math.min(Math.round((subtotal * coupon.value) / 100), coupon.maxDiscount);
  }
  if (coupon?.type === 'flat') return Math.min(coupon.value, subtotal);
  return 0;
}

// `lines` are { price, quantity, productId? }, with price in paise.
// `availablePoints` is the balance the shopper chose to spend, if any.
export function calculateTotals(lines, { deliveryId = 'standard', coupon = null, availablePoints = 0 } = {}) {
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const bundleDiscount = bundleSavings(lines);
  const applied = coupon && !couponProblem(coupon, subtotal) ? coupon : null;
  const discount = Math.min(discountFor(applied, subtotal), subtotal - bundleDiscount);
  const delivery = deliveryOptions.find((option) => option.id === deliveryId) ?? deliveryOptions[0];

  const isFree = applied?.type === 'shipping'
    || (delivery.freeAbove !== null && subtotal >= delivery.freeAbove);
  const shipping = subtotal === 0 || isFree ? 0 : delivery.fee;
  const netOfDiscounts = subtotal - bundleDiscount - discount;
  const tax = Math.round((netOfDiscounts * TAX_PERCENT) / 100);
  const payable = netOfDiscounts + shipping + tax;

  const pointsUsed = pointsToUse(availablePoints, payable);
  const pointsValue = pointsUsed * POINT_VALUE_PAISE;

  return {
    subtotal,
    bundleDiscount,
    discount,
    shipping,
    tax,
    pointsUsed,
    pointsValue,
    netOfDiscounts,
    total: payable - pointsValue,
    couponCode: applied?.code ?? null,
  };
}
