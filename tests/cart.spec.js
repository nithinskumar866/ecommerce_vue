import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { productsApi } from '@/api/products';
import { useCartStore } from '@/stores/cart';
import { useCatalogStore } from '@/stores/catalog';

const phone = { id: 1, name: 'Phone', price: 100000, mrp: 100000, stock: 2, images: ['p.jpg'] };

function setup(saved) {
  localStorage.clear();
  if (saved !== undefined) localStorage.setItem('shop:cart', saved);
  setActivePinia(createPinia());
  useCatalogStore().products = [phone];
  return useCartStore();
}

beforeEach(() => vi.restoreAllMocks());

describe('cart store', () => {
  it('adds up to the available stock and no further', () => {
    const cart = setup();
    expect(cart.add(phone)).toBe(true);
    expect(cart.add(phone)).toBe(true);
    expect(cart.add(phone)).toBe(false);
    expect(cart.count).toBe(2);
  });

  it('removes a line when its quantity reaches zero', () => {
    const cart = setup();
    cart.add(phone);
    cart.setQuantity('1||', 0);
    expect(cart.items).toEqual([]);
  });

  it('survives corrupt saved data', () => {
    expect(setup('{bad json').count).toBe(0);
    expect(setup('"not an array"').count).toBe(0);
  });

  it('drops invalid lines and never reads prices from storage', () => {
    const cart = setup(JSON.stringify([
      { productId: 1, quantity: 1, price: 1 },
      { productId: 1, quantity: -5 },
      { productId: 99, quantity: 1 },
      null,
    ]));
    expect(cart.items).toHaveLength(1);
    expect(cart.totals.subtotal).toBe(100000);
  });

  it('flags lines that exceed current stock', () => {
    const cart = setup(JSON.stringify([{ productId: 1, quantity: 5 }]));
    expect(cart.hasStockIssue).toBe(true);
  });

  it('rejects unknown coupons and reports when a cart stops qualifying', () => {
    const cart = setup();
    cart.add(phone);
    expect(cart.applyCoupon('NOPE')).toMatch(/not valid/);
    expect(cart.applyCoupon('flat500')).toMatch(/at least/);
    cart.add(phone);
    cart.setQuantity('1||', 2);
    expect(cart.applyCoupon('WELCOME10')).toBeNull();
    expect(cart.totals.discount).toBe(20000);
  });

  it('clears the coupon with the cart', () => {
    const cart = setup();
    cart.add(phone);
    cart.applyCoupon('FREESHIP');
    cart.clear();
    expect(cart.couponCode).toBe('');
  });
});

describe('catalog store', () => {
  it('reports a failed load and recovers on retry', async () => {
    setActivePinia(createPinia());
    const catalog = useCatalogStore();
    const list = vi.spyOn(productsApi, 'list').mockRejectedValueOnce(new Error('offline'));
    await catalog.load();
    expect(catalog.status).toBe('error');
    list.mockResolvedValueOnce([phone]);
    await catalog.load();
    expect(catalog.status).toBe('ready');
    expect(catalog.products).toEqual([phone]);
  });
});
