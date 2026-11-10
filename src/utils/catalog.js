export const PAGE_SIZE = 8;

export const sortOptions = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'rating', label: 'Top rated' },
  { id: 'discount', label: 'Biggest discount' },
];

const text = (value) => (typeof value === 'string' ? value.trim() : '');

function positiveNumber(value) {
  const number = Number(value);
  return text(value) !== '' && Number.isFinite(number) && number >= 0 ? number : null;
}

export function discountPercent(product) {
  return product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;
}

// The URL query is user-editable, so every value is validated here.
export function parseFilters(query) {
  const sort = text(query.sort);
  return {
    q: text(query.q),
    category: text(query.category),
    brands: text(query.brands).split(',').filter(Boolean),
    min: positiveNumber(query.min),
    max: positiveNumber(query.max),
    rating: positiveNumber(query.rating),
    inStock: query.inStock === '1',
    sort: sortOptions.some((option) => option.id === sort) ? sort : 'featured',
    page: Math.max(1, Math.floor(positiveNumber(query.page) ?? 1)),
  };
}

export function toQuery(filters) {
  const query = {};
  if (filters.q) query.q = filters.q;
  if (filters.category) query.category = filters.category;
  if (filters.brands.length) query.brands = filters.brands.join(',');
  if (filters.min !== null) query.min = String(filters.min);
  if (filters.max !== null) query.max = String(filters.max);
  if (filters.rating !== null) query.rating = String(filters.rating);
  if (filters.inStock) query.inStock = '1';
  if (filters.sort !== 'featured') query.sort = filters.sort;
  if (filters.page > 1) query.page = String(filters.page);
  return query;
}

const comparators = {
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  rating: (a, b) => b.rating - a.rating,
  discount: (a, b) => discountPercent(b) - discountPercent(a),
};

function matchesSearch(product, q) {
  const haystack = `${product.name} ${product.brand} ${product.category} ${product.description}`.toLowerCase();
  return q.toLowerCase().split(/\s+/).every((word) => haystack.includes(word));
}

// `min` and `max` are rupees (as typed by the shopper); product prices are paise.
export function applyFilters(products, filters) {
  const result = products.filter((product) => (
    (!filters.q || matchesSearch(product, filters.q))
    && (!filters.category || product.category === filters.category)
    && (!filters.brands.length || filters.brands.includes(product.brand))
    && (filters.min === null || product.price >= filters.min * 100)
    && (filters.max === null || product.price <= filters.max * 100)
    && (filters.rating === null || product.rating >= filters.rating)
    && (!filters.inStock || product.stock > 0)
  ));
  const compare = comparators[filters.sort];
  return compare ? result.sort(compare) : result;
}

export function paginate(items, page, pageSize = PAGE_SIZE) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, pageCount);
  return {
    items: items.slice((current - 1) * pageSize, current * pageSize),
    page: current,
    pageCount,
  };
}
