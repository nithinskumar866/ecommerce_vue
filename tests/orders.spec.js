import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authApi } from '@/api/auth';
import { ordersApi } from '@/api/orders';
import { allProducts } from '@/api/products';
import { currentStepIndex } from '@/utils/orderStatus';

const address = { name: 'A', phone: '9876543210', line1: 'x', city: 'y', state: 'z', pincode: '560038' };
const order = (overrides = {}) => ({
  lines: [{ productId: 3, quantity: 1 }],
  address,
  deliveryId: 'standard',
  couponCode: '',
  payment: { method: 'cod' },
  ...overrides,
});
const stockOf = (id) => allProducts().find((product) => product.id === id).stock;

beforeEach(async () => {
  localStorage.clear();
  await authApi.signup({ name: 'Asha', email: 'asha@example.com', password: 'password1' });
});

describe('placing an order', () => {
  it('prices from the catalog and reduces stock', async () => {
    const before = stockOf(3);
    const placed = await ordersApi.place(order());
    expect(placed.totals.subtotal).toBe(allProducts().find((product) => product.id === 3).price);
    expect(stockOf(3)).toBe(before - 1);
  });

  it('refuses more than the available stock', async () => {
    await expect(ordersApi.place(order({ lines: [{ productId: 3, quantity: 99 }] })))
      .rejects.toMatchObject({ code: 'out-of-stock' });
  });

  it('refuses fractional, negative and unknown items', async () => {
    for (const line of [{ productId: 3, quantity: 0.5 }, { productId: 3, quantity: -1 }, { productId: 999, quantity: 1 }]) {
      await expect(ordersApi.place(order({ lines: [line] }))).rejects.toMatchObject({ code: 'invalid-item' });
    }
  });

  it('keeps only the last four card digits', async () => {
    const placed = await ordersApi.place(order({ payment: { method: 'card', cardNumber: '4242 4242 4242 4242' } }));
    expect(placed.payment).toEqual({ method: 'card', last4: '4242' });
    expect(localStorage.getItem('shop:orders')).not.toContain('42424242');
  });

  it('leaves stock alone when the card is declined', async () => {
    const before = stockOf(3);
    await expect(ordersApi.place(order({ payment: { method: 'card', cardNumber: '4000000000000002' } })))
      .rejects.toMatchObject({ code: 'payment-declined' });
    expect(stockOf(3)).toBe(before);
  });

  it('needs a signed-in user', async () => {
    await authApi.logout();
    await expect(ordersApi.place(order())).rejects.toMatchObject({ code: 'unauthenticated' });
  });
});

describe('managing orders', () => {
  it('restores stock on cancel and blocks cancelling twice', async () => {
    const before = stockOf(3);
    const placed = await ordersApi.place(order());
    await ordersApi.cancel(placed.id);
    expect(stockOf(3)).toBe(before);
    await expect(ordersApi.cancel(placed.id)).rejects.toMatchObject({ code: 'too-late' });
  });

  it('refuses to cancel once shipped', async () => {
    const placed = await ordersApi.place(order());
    vi.spyOn(Date, 'now').mockReturnValue(new Date(placed.createdAt).getTime() + 4 * 60 * 1000);
    await expect(ordersApi.cancel(placed.id)).rejects.toMatchObject({ code: 'too-late' });
    vi.restoreAllMocks();
  });

  it("hides one user's orders from another", async () => {
    const placed = await ordersApi.place(order());
    await authApi.signup({ name: 'Ben', email: 'ben@example.com', password: 'password2' });
    await expect(ordersApi.get(placed.id)).rejects.toMatchObject({ code: 'not-found' });
    expect(await ordersApi.list()).toEqual([]);
  });

  it('advances order status with age', () => {
    const createdAt = '2026-01-01T00:00:00.000Z';
    const at = (minutes) => Date.parse(createdAt) + minutes * 60 * 1000;
    expect(currentStepIndex({ createdAt }, at(0))).toBe(0);
    expect(currentStepIndex({ createdAt }, at(2))).toBe(1);
    expect(currentStepIndex({ createdAt }, at(10))).toBe(3);
  });
});

describe('corrupt browser storage', () => {
  it.each([
    ['shop:reviews', '{}'],
    ['shop:sold', 'null'],
    ['shop:orders', '5'],
    ['shop:reviews', '[null, 1]'],
  ])('still loads the catalog and orders with %s = %s', async (key, value) => {
    localStorage.setItem(key, value);
    expect(allProducts()).toHaveLength(24);
    await expect(ordersApi.list()).resolves.toEqual([]);
  });

  it('treats corrupt accounts as signed out', async () => {
    localStorage.setItem('shop:users', '{"a":1}');
    await expect(authApi.currentUser()).resolves.toBeNull();
  });
});

describe('accounts', () => {
  it('never stores the password in plain text', () => {
    expect(localStorage.getItem('shop:users')).not.toContain('password1');
  });

  it('rejects duplicate emails regardless of case', async () => {
    await expect(authApi.signup({ name: 'X', email: 'ASHA@example.com', password: 'password1' }))
      .rejects.toMatchObject({ code: 'duplicate' });
  });

  it('gives the same error for a wrong password and an unknown email', async () => {
    await authApi.logout();
    await expect(authApi.login({ email: 'asha@example.com', password: 'wrong' }))
      .rejects.toMatchObject({ code: 'invalid-credentials' });
    await expect(authApi.login({ email: 'nobody@example.com', password: 'wrong' }))
      .rejects.toMatchObject({ code: 'invalid-credentials' });
  });

  it('can sign in to the seeded demo account', async () => {
    await authApi.logout();
    const user = await authApi.login({ email: 'demo@shop.test', password: 'demo1234' });
    expect(user.addresses).toHaveLength(1);
    expect(user).not.toHaveProperty('passwordHash');
  });
});
