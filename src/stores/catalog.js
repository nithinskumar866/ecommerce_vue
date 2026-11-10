import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { productsApi } from '@/api/products';
import { flashWindow } from '@/utils/deals';

export const useCatalogStore = defineStore('catalog', () => {
  const products = ref([]);
  const status = ref('idle');
  const byId = computed(() => new Map(products.value.map((product) => [product.id, product])));
  const brands = computed(() => [...new Set(products.value.map((p) => p.brand))].sort());
  const flashDeals = computed(() => products.value.filter((product) => product.flashEndsAt && product.stock > 0));

  let refreshTimer = null;

  // Prices change when a flash sale ends, so the catalog reloads at that moment.
  function scheduleRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => load({ force: true }), flashWindow().endsAt - Date.now() + 500);
  }

  async function load({ force = false } = {}) {
    if (status.value === 'ready' && !force) return;
    if (status.value !== 'ready') status.value = 'loading';
    try {
      products.value = await productsApi.list();
      status.value = 'ready';
      scheduleRefresh();
    } catch {
      status.value = 'error';
    }
  }

  return { products, status, byId, brands, flashDeals, load };
});
