<script setup>
import { computed, ref, watch } from 'vue';
import ProductPurchase from './ProductPurchase.vue';
import RatingStars from './RatingStars.vue';
import ShopOverlay from './ShopOverlay.vue';
import { useCatalogStore } from '@/stores/catalog';
import { useUiStore } from '@/stores/ui';

const catalog = useCatalogStore();
const ui = useUiStore();

const product = computed(() => catalog.byId.get(ui.quickViewId));
const image = ref('');
const imageEl = ref(null);

watch(product, (current) => { if (current) image.value = current.images[0]; });
const close = () => { ui.quickViewId = null; };
</script>

<template>
  <ShopOverlay :open="Boolean(product)" :label="product ? `Quick view: ${product.name}` : 'Quick view'" variant="dialog" @close="close">
    <div v-if="product" class="row g-0" data-testid="quick-view">
      <div class="col-md-6">
        <img ref="imageEl" :src="image" :alt="product.name" class="product-image h-100" data-testid="quick-view-image">
      </div>
      <div class="col-md-6 p-4 position-relative">
        <button type="button" class="btn btn-outline-secondary icon-btn position-absolute top-0 end-0 m-3" aria-label="Close quick view" @click="close">
          <i class="bi bi-x-lg" aria-hidden="true"></i>
        </button>
        <p class="eyebrow mb-1">{{ product.brand }}</p>
        <h2 class="h3 pe-5">{{ product.name }}</h2>
        <div class="mb-2"><RatingStars :rating="product.rating" :count="product.reviewCount" /></div>
        <p class="small text-body-secondary">{{ product.description }}</p>
        <ProductPurchase :product="product" :fly-source="imageEl" @image="image = $event" @added="close" />
        <router-link :to="`/product/${product.id}`" class="d-inline-block small mt-3">View full details</router-link>
      </div>
    </div>
  </ShopOverlay>
</template>
