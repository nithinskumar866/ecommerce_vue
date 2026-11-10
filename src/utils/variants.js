// A selection is { color, storage }; either is null for products without that option.
export function defaultSelection(product) {
  return {
    color: product.colors?.[0]?.id ?? null,
    storage: product.storages?.[0]?.id ?? null,
  };
}

export const hasOptions = (product) => Boolean(product.colors?.length || product.storages?.length);

export const lineKey = (productId, { color = null, storage = null } = {}) => `${productId}|${color ?? ''}|${storage ?? ''}`;

function pick(options, id) {
  if (!options?.length) return id == null ? { found: true, option: null } : { found: false };
  const option = options.find((candidate) => candidate.id === id);
  return { found: Boolean(option), option };
}

// Returns the priced variant, or null when the selection doesn't exist on this product.
export function resolveVariant(product, selection = defaultSelection(product)) {
  const color = pick(product.colors, selection.color ?? null);
  const storage = pick(product.storages, selection.storage ?? null);
  if (!color.found || !storage.found) return null;

  const delta = storage.option?.delta ?? 0;
  return {
    key: lineKey(product.id, selection),
    color: color.option?.id ?? null,
    storage: storage.option?.id ?? null,
    label: [color.option?.label, storage.option?.label].filter(Boolean).join(' · '),
    price: product.price + delta,
    mrp: product.mrp + delta,
    image: color.option?.image ?? product.images[0],
  };
}
