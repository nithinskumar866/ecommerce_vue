const HOUR = 60 * 60 * 1000;

export const FLASH_WINDOW_MS = 6 * HOUR;
export const FLASH_PERCENT = 15;
const FLASH_COUNT = 4;

// A real rotation: every six hours a different set of products goes on sale.
export function flashWindow(now = Date.now()) {
  const index = Math.floor(now / FLASH_WINDOW_MS);
  return { index, endsAt: (index + 1) * FLASH_WINDOW_MS };
}

export function flashProductIds(index, ids) {
  const pool = [...ids];
  const picked = [];
  let seed = (index * 2654435761) % 4294967296;
  while (picked.length < FLASH_COUNT && pool.length) {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    picked.push(pool.splice(seed % pool.length, 1)[0]);
  }
  return picked;
}

export const BUNDLE_PERCENT = 5;

export const bundles = [
  { id: 'phone-buds', title: 'Everyday pair', items: [4, 7] },
  { id: 'desk-setup', title: 'Desk setup', items: [13, 14] },
  { id: 'laptop-mouse', title: 'Work anywhere', items: [12, 15] },
  { id: 'power-duo', title: 'Power duo', items: [21, 22] },
  { id: 'cosy-light', title: 'Cosy lighting', items: [16, 17] },
  { id: 'fit-sound', title: 'Workout kit', items: [10, 9] },
];

export const bundleFor = (productId) => bundles.find((bundle) => bundle.items.includes(productId)) ?? null;

// `lines` are { productId, price, quantity }. Each unit counts towards one bundle only.
export function bundleSavings(lines) {
  const units = new Map();
  lines.forEach(({ productId, price, quantity }) => {
    if (productId === undefined) return;
    const current = units.get(productId) ?? { quantity: 0, price };
    units.set(productId, { quantity: current.quantity + quantity, price: Math.min(current.price, price) });
  });

  return bundles.reduce((total, bundle) => {
    const [first, second] = bundle.items.map((id) => units.get(id));
    if (!first || !second) return total;
    const pairs = Math.min(first.quantity, second.quantity);
    first.quantity -= pairs;
    second.quantity -= pairs;
    return total + Math.round(((first.price + second.price) * pairs * BUNDLE_PERCENT) / 100);
  }, 0);
}
