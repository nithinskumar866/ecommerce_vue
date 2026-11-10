import { computed, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { useCatalogStore } from './catalog';
import { calculateTotals, couponProblem, findCoupon } from '@/utils/pricing';
import { onStorageChange, readStorage, writeStorage } from '@/utils/storage';
import { defaultSelection, lineKey, resolveVariant } from '@/utils/variants';

// Saved carts may be corrupt or hand-edited, so only valid ids and quantities are kept.
function readLines() {
  const saved = readStorage('cart', []);
  if (!Array.isArray(saved)) return [];
  return saved.filter((line) => (
    Number.isInteger(line?.productId) && Number.isInteger(line?.quantity) && line.quantity > 0
  )).map(({ productId, quantity, color = null, storage = null }) => ({ productId, quantity, color, storage }));
}

export const useCartStore = defineStore('cart', () => {
  const catalog = useCatalogStore();
  const lines = ref(readLines());
  const couponCode = ref(readStorage('coupon', ''));

  watch(lines, (value) => writeStorage('cart', value), { deep: true });
  watch(couponCode, (value) => writeStorage('coupon', value));
  onStorageChange('cart', () => { lines.value = readLines(); });

  const count = computed(() => lines.value.reduce((sum, line) => sum + line.quantity, 0));

  const quantityOf = (productId) => lines.value
    .filter((line) => line.productId === productId)
    .reduce((sum, line) => sum + line.quantity, 0);

  const items = computed(() => lines.value.flatMap((line) => {
    const product = catalog.byId.get(line.productId);
    const variant = product && resolveVariant(product, line);
    return variant ? [{ key: variant.key, product, variant, quantity: line.quantity }] : [];
  }));

  // Variants of one product share its stock.
  const isOverStock = (productId) => quantityOf(productId) > (catalog.byId.get(productId)?.stock ?? 0);
  const hasStockIssue = computed(() => items.value.some((item) => isOverStock(item.product.id)));
  const coupon = computed(() => findCoupon(couponCode.value));

  const pricedLines = computed(() => items.value.map((item) => ({
    productId: item.product.id,
    price: item.variant.price,
    quantity: item.quantity,
  })));

  const totalsFor = (deliveryId, availablePoints = 0) => calculateTotals(pricedLines.value, {
    deliveryId, coupon: coupon.value, availablePoints,
  });
  const totals = computed(() => totalsFor('standard'));

  // Set when a coupon was applied but the cart no longer qualifies for it.
  const couponNotice = computed(() => (coupon.value ? couponProblem(coupon.value, totals.value.subtotal) : null));

  const findLine = (key) => lines.value.find((line) => lineKey(line.productId, line) === key);

  // Returns false when stock would be exceeded.
  function add(product, quantity = 1, selection = defaultSelection(product)) {
    if (!resolveVariant(product, selection)) return false;
    if (quantityOf(product.id) + quantity > product.stock) return false;
    const existing = findLine(lineKey(product.id, selection));
    if (existing) existing.quantity += quantity;
    else lines.value.push({ productId: product.id, quantity, color: selection.color ?? null, storage: selection.storage ?? null });
    return true;
  }

  function remove(key) {
    lines.value = lines.value.filter((line) => lineKey(line.productId, line) !== key);
  }

  function setQuantity(key, quantity) {
    if (quantity < 1) {
      remove(key);
      return;
    }
    const line = findLine(key);
    if (line) line.quantity = quantity;
  }

  function clear() {
    lines.value = [];
    couponCode.value = '';
  }

  // Returns an error message, or null on success.
  function applyCoupon(code) {
    const found = findCoupon(code);
    if (!found) return 'That coupon code is not valid.';
    const problem = couponProblem(found, totals.value.subtotal);
    if (problem) return problem;
    couponCode.value = found.code;
    return null;
  }

  function removeCoupon() {
    couponCode.value = '';
  }

  return {
    lines, couponCode, count, items, hasStockIssue, coupon, totals, couponNotice,
    totalsFor, quantityOf, isOverStock, add, setQuantity, remove, clear, applyCoupon, removeCoupon,
  };
});
