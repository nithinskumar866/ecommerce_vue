import { requireAdmin } from './auth';
import { respond } from './client';
import { readOrders } from './orders';
import { allProducts } from './products';
import { categories } from '@/data/products';

const DAY = 24 * 60 * 60 * 1000;
const HISTORY_DAYS = 120;

// A repeatable pseudo-random value in [0, 1), so simulated history never changes between visits.
function noise(seed) {
  const value = Math.sin(seed * 127.1) * 43758.5453;
  return value - Math.floor(value);
}

const dayNumber = (time) => Math.floor(time / DAY);

function simulatedDay(day) {
  const weekend = [2, 3].includes(day % 7) ? 1.25 : 1;
  const trend = 1 + (day % 1000) / 4000;
  const orders = Math.round((18 + noise(day) * 22) * weekend * trend);
  const averageOrder = 800000 + noise(day + 0.5) * 700000;
  return { orders, revenue: Math.round(orders * averageOrder), units: Math.round(orders * (1.2 + noise(day + 0.25) * 0.8)) };
}

function buildSeries(days, offset, today, realByDay) {
  return Array.from({ length: days }, (_, index) => {
    const day = today - offset - (days - 1 - index);
    const base = simulatedDay(day);
    const real = realByDay.get(day) ?? { orders: 0, revenue: 0, units: 0 };
    return {
      date: new Date(day * DAY).toISOString().slice(0, 10),
      orders: base.orders + real.orders,
      revenue: base.revenue + real.revenue,
      units: base.units + real.units,
    };
  });
}

function summarise(series) {
  const revenue = series.reduce((sum, day) => sum + day.revenue, 0);
  const orders = series.reduce((sum, day) => sum + day.orders, 0);
  const units = series.reduce((sum, day) => sum + day.units, 0);
  return { revenue, orders, units, averageOrder: orders ? Math.round(revenue / orders) : 0 };
}

function indexRealOrders(orders) {
  const byDay = new Map();
  orders.forEach((order) => {
    const day = dayNumber(new Date(order.createdAt).getTime());
    const entry = byDay.get(day) ?? { orders: 0, revenue: 0, units: 0 };
    entry.orders += 1;
    entry.revenue += order.totals.total;
    entry.units += order.items.reduce((sum, item) => sum + item.quantity, 0);
    byDay.set(day, entry);
  });
  return byDay;
}

const CATEGORY_WEIGHTS = { phones: 0.34, computing: 0.27, audio: 0.15, wearables: 0.1, home: 0.09, accessories: 0.05 };

export function buildDashboard(days, now = Date.now()) {
  const today = dayNumber(now);
  const windowStart = (today - days + 1) * DAY;
  const realOrders = readOrders().filter((order) => !order.cancelledAt && order.items && order.totals);
  const realByDay = indexRealOrders(realOrders);

  const series = buildSeries(days, 0, today, realByDay);
  const previous = buildSeries(days, days, today, realByDay);
  const totals = summarise(series);
  const inWindow = realOrders.filter((order) => new Date(order.createdAt).getTime() >= windowStart);
  const products = allProducts(now);

  const categoryRows = categories.map((category) => {
    const real = inWindow.flatMap((order) => order.items)
      .filter((item) => products.find((product) => product.id === item.productId)?.category === category.id)
      .reduce((sum, item) => sum + item.price * item.quantity, 0);
    return {
      id: category.id,
      label: category.label,
      revenue: Math.round(totals.revenue * CATEGORY_WEIGHTS[category.id]) + real,
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const topProducts = products.map((product) => {
    const realUnits = inWindow.flatMap((order) => order.items)
      .filter((item) => item.productId === product.id)
      .reduce((sum, item) => sum + item.quantity, 0);
    const simulatedUnits = Math.round((noise(product.id) * 0.6 + 0.4) * days * (100000 / (product.price / 100 + 8000)));
    const units = simulatedUnits + realUnits;
    return { id: product.id, name: product.name, image: product.images[0], units, revenue: units * product.price };
  }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const lowStock = products
    .filter((product) => product.stock <= 5)
    .sort((a, b) => a.stock - b.stock)
    .map(({ id, name, stock }) => ({ id, name, stock }));

  return {
    series,
    totals,
    previous: summarise(previous),
    categories: categoryRows,
    topProducts,
    lowStock,
    liveOrderCount: inWindow.length,
  };
}

export const MAX_DASHBOARD_DAYS = HISTORY_DAYS / 2;

export const adminApi = {
  dashboard: (days) => respond(() => {
    requireAdmin();
    return buildDashboard(Math.min(days, MAX_DASHBOARD_DAYS));
  }),
};
