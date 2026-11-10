import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { buildDashboard } from '@/api/admin';
import { authApi } from '@/api/auth';
import { ordersApi } from '@/api/orders';
import { allProducts } from '@/api/products';
import { useCartStore } from '@/stores/cart';
import { useCatalogStore } from '@/stores/catalog';
import { useCompareStore } from '@/stores/preferences';
import { FLASH_WINDOW_MS, bundleSavings, flashProductIds, flashWindow } from '@/utils/deals';
import { recommendProducts } from '@/utils/finder';
import { pointsEarned, pointsToUse, tierFor } from '@/utils/loyalty';
import { calculateTotals } from '@/utils/pricing';
import { lineKey, resolveVariant } from '@/utils/variants';

const address = { name: 'A', phone: '9876543210', line1: 'x', city: 'y', state: 'z', pincode: '560038' };
const find = (id) => allProducts().find((product) => product.id === id);

beforeEach(() => {
  localStorage.clear();
  setActivePinia(createPinia());
});

describe('variants', () => {
  const product = {
    id: 1, price: 100, mrp: 200, images: ['a'],
    colors: [{ id: 'red', label: 'Red', image: 'red.jpg' }],
    storages: [{ id: '1', label: '1 GB', delta: 0 }, { id: '2', label: '2 GB', delta: 50 }],
  };

  it('adds the storage price and uses the colour image', () => {
    expect(resolveVariant(product, { color: 'red', storage: '2' })).toMatchObject({ price: 150, mrp: 250, image: 'red.jpg', label: 'Red · 2 GB' });
  });

  it('rejects options the product does not have', () => {
    expect(resolveVariant(product, { color: 'blue', storage: '1' })).toBeNull();
    expect(resolveVariant({ id: 2, price: 1, mrp: 1, images: ['a'] }, { color: 'red', storage: null })).toBeNull();
  });

  it('keeps variants as separate cart lines sharing one stock count', () => {
    const phone = { ...product, stock: 3 };
    const cart = useCartStore();
    useCatalogStore().products = [phone];
    cart.add(phone, 2, { color: 'red', storage: '1' });
    expect(cart.add(phone, 2, { color: 'red', storage: '2' })).toBe(false);
    expect(cart.add(phone, 1, { color: 'red', storage: '2' })).toBe(true);
    expect(cart.items).toHaveLength(2);
    cart.setQuantity(lineKey(1, { color: 'red', storage: '2' }), 0);
    expect(cart.count).toBe(2);
  });

  it('drops saved lines with invented options', () => {
    localStorage.setItem('shop:cart', JSON.stringify([{ productId: 4, quantity: 1, color: 'gold', storage: '128' }]));
    const cart = useCartStore();
    useCatalogStore().products = allProducts();
    expect(cart.items).toEqual([]);
  });
});

describe('flash deals', () => {
  it('rotates to a new set when the window ends', () => {
    const ids = allProducts().map((product) => product.id);
    const first = flashProductIds(100, ids);
    expect(new Set(first).size).toBe(4);
    expect(flashProductIds(100, ids)).toEqual(first);
    expect(flashProductIds(101, ids)).not.toEqual(first);
  });

  it('reports when the current window ends', () => {
    const start = 5 * FLASH_WINDOW_MS;
    expect(flashWindow(start + 10)).toEqual({ index: 5, endsAt: 6 * FLASH_WINDOW_MS });
  });

  it('discounts only flash products and restores the price afterwards', () => {
    const now = 400 * FLASH_WINDOW_MS + 1;
    const during = allProducts(now);
    const onSale = during.find((product) => product.flashEndsAt);
    const afterwards = allProducts(now + FLASH_WINDOW_MS * 3).find((product) => product.id === onSale.id);
    expect(onSale.price).toBeLessThan(onSale.mrp);
    expect(during.filter((product) => product.flashEndsAt)).toHaveLength(4);
    if (!afterwards.flashEndsAt) expect(afterwards.price).toBeGreaterThan(onSale.price);
  });
});

describe('bundles', () => {
  const line = (productId, price, quantity = 1) => ({ productId, price, quantity });

  it('saves 5% only when both items are present', () => {
    expect(bundleSavings([line(4, 100000), line(7, 100000)])).toBe(10000);
    expect(bundleSavings([line(4, 100000)])).toBe(0);
  });

  it('counts each pair once', () => {
    expect(bundleSavings([line(4, 100000, 3), line(7, 100000, 1)])).toBe(10000);
  });

  it('lets a unit count towards only one bundle', () => {
    const lines = [line(13, 100000), line(14, 100000)];
    expect(bundleSavings(lines)).toBe(10000);
  });

  it('feeds into totals before tax', () => {
    const totals = calculateTotals([line(4, 100000), line(7, 100000)]);
    expect(totals.bundleDiscount).toBe(10000);
    expect(totals.tax).toBe(9500);
  });
});

describe('loyalty', () => {
  it('assigns tiers by lifetime points', () => {
    expect(tierFor(0).id).toBe('bronze');
    expect(tierFor(1000).id).toBe('silver');
    expect(tierFor(5000).id).toBe('gold');
  });

  it('earns more at higher tiers', () => {
    expect(pointsEarned(1000000, 0)).toBe(100);
    expect(pointsEarned(1000000, 5000)).toBe(150);
  });

  it('caps redemption at 20% of the order and at the balance', () => {
    expect(pointsToUse(10000, 100000)).toBe(200);
    expect(pointsToUse(50, 100000)).toBe(50);
  });

  it('redeems and earns on an order, and reverses both on cancel', async () => {
    await authApi.login({ email: 'demo@shop.test', password: 'demo1234' });
    const order = await ordersApi.place({
      lines: [{ productId: 21, quantity: 1 }], address, deliveryId: 'standard', couponCode: '', payment: { method: 'cod' }, usePoints: true,
    });
    expect(order.totals.pointsUsed).toBeGreaterThan(0);
    let user = await authApi.currentUser();
    expect(user.points).toBe(750 - order.totals.pointsUsed + order.pointsEarned);

    await ordersApi.cancel(order.id);
    user = await authApi.currentUser();
    expect(user.points).toBe(750);
  });

  it('never spends points unless asked', async () => {
    await authApi.login({ email: 'demo@shop.test', password: 'demo1234' });
    const order = await ordersApi.place({
      lines: [{ productId: 21, quantity: 1 }], address, deliveryId: 'standard', couponCode: '', payment: { method: 'cod' },
    });
    expect(order.totals.pointsUsed).toBe(0);
  });
});

describe('orders with variants', () => {
  beforeEach(() => authApi.signup({ name: 'Asha', email: 'asha@example.com', password: 'password1' }));

  it('charges the option price', async () => {
    const order = await ordersApi.place({
      lines: [{ productId: 4, quantity: 1, color: 'white', storage: '256' }], address, deliveryId: 'standard', couponCode: '', payment: { method: 'cod' },
    });
    expect(order.items[0].price).toBe(find(4).price + 400000);
    expect(order.items[0].variantLabel).toBe('Pearl · 256 GB');
  });

  it('rejects an invented option', async () => {
    await expect(ordersApi.place({
      lines: [{ productId: 4, quantity: 1, color: 'gold', storage: '256' }], address, deliveryId: 'standard', couponCode: '', payment: { method: 'cod' },
    })).rejects.toMatchObject({ code: 'invalid-item' });
  });

  it('applies shared stock across variants', async () => {
    await expect(ordersApi.place({
      lines: [
        { productId: 11, quantity: 10, color: 'black' },
        { productId: 11, quantity: 10, color: 'white' },
      ],
      address, deliveryId: 'standard', couponCode: '', payment: { method: 'cod' },
    })).rejects.toMatchObject({ code: 'out-of-stock' });
  });
});

describe('product finder', () => {
  const products = allProducts();

  it('returns three in-stock products, best match first', () => {
    const results = recommendProducts(products, { use: 'fitness', budget: 'low', priority: 'value' });
    expect(results).toHaveLength(3);
    expect(results.every((result) => result.product.stock > 0)).toBe(true);
    expect(results[0].match).toBeGreaterThanOrEqual(results[2].match);
    expect(results[0].product.uses).toContain('fitness');
  });

  it('respects the budget for its best match', () => {
    const [best] = recommendProducts(products, { use: 'work', budget: 'high', priority: 'premium' });
    expect(best.product.price).toBeGreaterThanOrEqual(2500000);
  });
});

describe('compare', () => {
  it('holds at most four products', () => {
    const compare = useCompareStore();
    [1, 2, 3, 4].forEach((id) => expect(compare.toggle(id)).toBe(true));
    expect(compare.toggle(5)).toBe(false);
    expect(compare.count).toBe(4);
    compare.toggle(1);
    expect(compare.has(1)).toBe(false);
  });
});

describe('admin dashboard', () => {
  it('produces stable simulated history', () => {
    const now = Date.UTC(2026, 5, 15);
    expect(buildDashboard(30, now).totals).toEqual(buildDashboard(30, now).totals);
    expect(buildDashboard(30, now).series).toHaveLength(30);
  });

  it('adds real orders on top and ignores cancelled ones', async () => {
    const before = buildDashboard(7).totals.orders;
    await authApi.signup({ name: 'Asha', email: 'asha@example.com', password: 'password1' });
    const order = await ordersApi.place({
      lines: [{ productId: 21, quantity: 1 }], address, deliveryId: 'standard', couponCode: '', payment: { method: 'cod' },
    });
    expect(buildDashboard(7).totals.orders).toBe(before + 1);
    await ordersApi.cancel(order.id);
    expect(buildDashboard(7).totals.orders).toBe(before);
  });

  it('is limited to the demo account', async () => {
    const { adminApi } = await import('@/api/admin');
    await expect(adminApi.dashboard(7)).rejects.toMatchObject({ code: 'unauthenticated' });
    await authApi.signup({ name: 'Asha', email: 'asha@example.com', password: 'password1' });
    await expect(adminApi.dashboard(7)).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('survives Date mocks without using real time', () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.UTC(2026, 0, 1));
    expect(buildDashboard(7).series.at(-1).date).toBe('2026-01-01');
    vi.restoreAllMocks();
  });
});
