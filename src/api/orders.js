import { ApiError, randomId, respond } from './client';
import { requireUser, updateUser } from './auth';
import { allProducts, readSold } from './products';
import { pointsEarned } from '@/utils/loyalty';
import { calculateTotals, findCoupon } from '@/utils/pricing';
import { canCancel } from '@/utils/orderStatus';
import { readRecords, writeStorage } from '@/utils/storage';
import { resolveVariant } from '@/utils/variants';

export const readOrders = () => readRecords('orders');
const writeOrders = (orders) => writeStorage('orders', orders);

function adjustSold(items, direction) {
  const sold = readSold();
  items.forEach(({ productId, quantity }) => {
    sold[productId] = (sold[productId] ?? 0) + direction * quantity;
  });
  writeStorage('sold', sold);
}

function ownOrder(id) {
  const user = requireUser();
  const order = readOrders().find((item) => item.id === id && item.userId === user.id);
  if (!order) throw new ApiError('We could not find that order.', 'not-found');
  return order;
}

// Only what a real gateway would return is kept; full card numbers and CVVs never reach storage.
function paymentRecord({ method, cardNumber, upiId }) {
  if (method === 'card') {
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.endsWith('0002')) {
      throw new ApiError('The card was declined. Try another payment method.', 'payment-declined');
    }
    return { method, last4: digits.slice(-4) };
  }
  if (method === 'upi') return { method, upiId: upiId.trim() };
  if (method === 'cod') return { method };
  throw new ApiError('Choose a payment method.', 'invalid-payment');
}

function buildItems(lines) {
  const catalog = allProducts();
  const reserved = new Map();

  const items = lines.map(({ productId, color = null, storage = null, quantity }) => {
    const product = catalog.find((candidate) => candidate.id === productId);
    const variant = product && resolveVariant(product, { color, storage });
    if (!variant || !Number.isInteger(quantity) || quantity < 1) {
      throw new ApiError('An item in your cart is no longer available.', 'invalid-item');
    }
    const total = (reserved.get(productId) ?? 0) + quantity;
    reserved.set(productId, total);
    if (total > product.stock) {
      throw new ApiError(`Only ${product.stock} of ${product.name} left in stock.`, 'out-of-stock');
    }
    return {
      productId, color, storage, quantity,
      name: product.name,
      variantLabel: variant.label,
      image: variant.image,
      price: variant.price,
    };
  });

  if (!items.length) throw new ApiError('Your cart is empty.', 'empty-cart');
  return items;
}

export const ordersApi = {
  list: () => respond(() => {
    const user = requireUser();
    return readOrders()
      .filter((order) => order.userId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }),

  get: (id) => respond(() => ownOrder(id)),

  // Acts like a server: stock, prices and points are re-checked rather than trusted from the client.
  place: ({ lines, address, deliveryId, couponCode, payment, usePoints = false }) => respond(() => {
    const user = requireUser();
    const items = buildItems(lines);
    const paymentDetails = paymentRecord(payment);
    const points = user.points ?? 0;
    const lifetimePoints = user.lifetimePoints ?? 0;

    const totals = calculateTotals(items, {
      deliveryId,
      coupon: findCoupon(couponCode),
      availablePoints: usePoints ? points : 0,
    });
    const earned = pointsEarned(totals.netOfDiscounts, lifetimePoints);

    const order = {
      id: `ORD-${randomId(4).toUpperCase()}`,
      userId: user.id,
      createdAt: new Date().toISOString(),
      cancelledAt: null,
      items,
      address,
      deliveryId,
      payment: paymentDetails,
      totals,
      pointsEarned: earned,
    };
    writeOrders([...readOrders(), order]);
    adjustSold(items, 1);
    updateUser({ points: points - totals.pointsUsed + earned, lifetimePoints: lifetimePoints + earned });
    return order;
  }),

  cancel: (id) => respond(() => {
    const order = ownOrder(id);
    if (!canCancel(order)) throw new ApiError('This order can no longer be cancelled.', 'too-late');
    const cancelled = { ...order, cancelledAt: new Date().toISOString() };
    writeOrders(readOrders().map((item) => (item.id === id ? cancelled : item)));
    adjustSold(order.items, -1);

    const user = requireUser();
    updateUser({
      points: Math.max(0, (user.points ?? 0) + (order.totals.pointsUsed ?? 0) - (order.pointsEarned ?? 0)),
      lifetimePoints: Math.max(0, (user.lifetimePoints ?? 0) - (order.pointsEarned ?? 0)),
    });
    return cancelled;
  }),
};
