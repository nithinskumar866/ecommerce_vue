import { describe, expect, it } from 'vitest';
import { applyFilters, paginate, parseFilters, toQuery } from '@/utils/catalog';

const item = (id, overrides) => ({
  id, name: `Item ${id}`, brand: 'A', category: 'audio', description: '', price: 100000, mrp: 100000, stock: 5, rating: 4, ...overrides,
});

describe('parseFilters', () => {
  it('falls back to safe defaults for hostile query values', () => {
    const filters = parseFilters({ min: 'abc', max: '-5', page: '-2', sort: 'nope', rating: '' });
    expect(filters).toMatchObject({ min: null, max: null, page: 1, sort: 'featured', rating: null });
  });

  it('round-trips through the URL query', () => {
    const query = { q: 'buds', category: 'audio', brands: 'A,B', min: '10', sort: 'rating', page: '2', inStock: '1' };
    expect(toQuery(parseFilters(query))).toEqual(query);
  });
});

describe('applyFilters', () => {
  const products = [
    item(1, { name: 'Red Speaker', price: 500000, rating: 5 }),
    item(2, { name: 'Blue Earbuds', price: 100000, brand: 'B', stock: 0, rating: 3 }),
    item(3, { name: 'Red Laptop', category: 'computing', price: 300000, mrp: 600000, rating: 4 }),
  ];
  const ids = (query) => applyFilters(products, parseFilters(query)).map((product) => product.id);

  it('requires every search word to match, ignoring case', () => {
    expect(ids({ q: 'RED speaker' })).toEqual([1]);
  });

  it('filters by category, brand and availability', () => {
    expect(ids({ category: 'computing' })).toEqual([3]);
    expect(ids({ brands: 'B' })).toEqual([2]);
    expect(ids({ inStock: '1' })).toEqual([1, 3]);
  });

  it('compares a rupee price range against paise prices', () => {
    expect(ids({ min: '2000', max: '4000' })).toEqual([3]);
  });

  it('sorts without changing the source list', () => {
    expect(ids({ sort: 'price-asc' })).toEqual([2, 3, 1]);
    expect(ids({ sort: 'discount' })[0]).toBe(3);
    expect(products[0].id).toBe(1);
  });
});

describe('paginate', () => {
  it('clamps a page beyond the end to the last page', () => {
    const result = paginate([1, 2, 3, 4, 5], 99, 2);
    expect(result).toEqual({ items: [5], page: 3, pageCount: 3 });
  });
});
