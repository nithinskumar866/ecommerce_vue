<script setup>
import { computed } from 'vue';
import { useShopActions } from '@/composables/useShopActions';
import { useCatalogStore } from '@/stores/catalog';
import { BUNDLE_PERCENT } from '@/utils/deals';
import { formatMoney } from '@/utils/pricing';

const props = defineProps({
  bundle: { type: Object, required: true },
  heading: { type: String, default: '' },
});

const catalog = useCatalogStore();
const { addToCart } = useShopActions();

const products = computed(() => props.bundle.items.flatMap((id) => catalog.byId.get(id) ?? []));
const total = computed(() => products.value.reduce((sum, product) => sum + product.price, 0));
const saving = computed(() => Math.round((total.value * BUNDLE_PERCENT) / 100));
const available = computed(() => products.value.length === 2 && products.value.every((product) => product.stock > 0));

function addBundle() {
  products.value.forEach((product) => addToCart(product));
}
</script>

<template>
  <article class="card card-body bundle" data-testid="bundle">
    <p class="eyebrow mb-3">{{ heading || bundle.title }}</p>
    <div class="d-flex align-items-center gap-3 mb-3">
      <template v-for="(product, index) in products" :key="product.id">
        <i v-if="index" class="bi bi-plus-lg text-body-secondary" aria-hidden="true"></i>
        <router-link :to="`/product/${product.id}`" class="bundle__item text-decoration-none">
          <img :src="product.images[0]" :alt="product.name" class="product-image rounded-4">
          <span class="d-block small text-body mt-2">{{ product.name }}</span>
        </router-link>
      </template>
    </div>
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-auto">
      <div>
        <strong class="fs-5 display-font">{{ formatMoney(total - saving) }}</strong>
        <span class="small text-primary ms-2">Save {{ formatMoney(saving) }}</span>
      </div>
      <button type="button" class="btn btn-primary btn-sm" :disabled="!available" @click="addBundle">
        {{ available ? 'Add both' : 'Unavailable' }}
      </button>
    </div>
  </article>
</template>

<style scoped>
.bundle__item {
  flex: 1;
  min-width: 0;
}
</style>
