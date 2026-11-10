import { describe, expect, it } from 'vitest';
import { isCardNumber, isFutureExpiry, safeRedirect, validateAddress, validateUpi } from '@/utils/validators';

describe('card validation', () => {
  it('accepts a Luhn-valid number with spaces and rejects a typo', () => {
    expect(isCardNumber('4242 4242 4242 4242')).toBe(true);
    expect(isCardNumber('4242 4242 4242 4241')).toBe(false);
    expect(isCardNumber('')).toBe(false);
  });

  it('treats a card as valid through the end of its expiry month', () => {
    const now = new Date(2026, 10, 30);
    expect(isFutureExpiry('11/26', now)).toBe(true);
    expect(isFutureExpiry('10/26', now)).toBe(false);
    expect(isFutureExpiry('13/30', now)).toBe(false);
  });
});

describe('address validation', () => {
  it('reports each invalid field', () => {
    expect(Object.keys(validateAddress({ phone: '123', pincode: '012345' })))
      .toEqual(['name', 'phone', 'line1', 'city', 'state', 'pincode']);
  });

  it('accepts a complete Indian address', () => {
    expect(validateAddress({ name: 'A', phone: '9876543210', line1: 'x', city: 'y', state: 'z', pincode: '560038' })).toEqual({});
  });
});

describe('other validators', () => {
  it('checks UPI IDs', () => {
    expect(validateUpi({ id: 'name@bank' })).toEqual({});
    expect(validateUpi({ id: 'name' })).toHaveProperty('id');
  });

  it('refuses redirects that leave the site', () => {
    expect(safeRedirect('/checkout')).toBe('/checkout');
    expect(safeRedirect('//evil.example')).toBe('/');
    expect(safeRedirect('https://evil.example')).toBe('/');
    expect(safeRedirect(undefined)).toBe('/');
  });
});
