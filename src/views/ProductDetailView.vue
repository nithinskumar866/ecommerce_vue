<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import BundleOffer from '@/components/BundleOffer.vue';
import CatalogGate from '@/components/CatalogGate.vue';
import EmptyState from '@/components/EmptyState.vue';
import ProductGrid from '@/components/ProductGrid.vue';
import ProductPurchase from '@/components/ProductPurchase.vue';
import RatingStars from '@/components/RatingStars.vue';
import ReviewsSection from '@/components/ReviewsSection.vue';
import { setPageTitle } from '@/router';
import { useCatalogStore } from '@/stores/catalog';
import { useRecentlyViewedStore } from '@/stores/preferences';
import { bundleFor } from '@/utils/deals';

const route = useRoute();
const catalog = useCatalogStore();
const recent = useRecentlyViewedStore();

const product = computed(() => catalog.byId.get(Number(route.params.id)));
const activeImage = ref('');
const mainImage = ref(null);
const zoom = ref({ active: false, x: 50, y: 50 });

const bundle = computed(() => (product.value ? bundleFor(product.value.id) : null));
const related = computed(() => catalog.products
  .filter((item) => item.category === product.value.category && item.id !== product.value.id)
  .slice(0, 4));

watch(() => product.value?.id, (id) => {
  if (!id) return;
  activeImage.value = product.value.images[0];
  recent.record(id);
  setPageTitle(product.value.name);
}, { immediate: true });

function moveZoom(event) {
  const box = event.currentTarget.getBoundingClientRect();
  zoom.value = {
    active: true,
    x: ((event.clientX - box.left) / box.width) * 100,
    y: ((event.clientY - box.top) / box.height) * 100,
  };
}
</script>

<template>
  <CatalogGate>
    <EmptyState v-if="!product" icon="bi-box" title="Product not found" message="It may have been removed or the link may be wrong.">
      <router-link to="/products" class="btn btn-primary">Browse products</router-link>
    </EmptyState>

    <template v-else>
      <nav aria-label="Breadcrumb">
        <ol class="breadcrumb small">
          <li class="breadcrumb-item"><router-link to="/products">Shop</router-link></li>
          <li class="breadcrumb-item"><router-link :to="{ path: '/products', query: { category: product.category } }">{{ product.brand }}</router-link></li>
          <li class="breadcrumb-item active" aria-current="page">{{ product.name }}</li>
        </ol>
      </nav>

      <div class="row g-4 g-lg-5">
        <div class="col-md-6">
          <div class="zoom-frame" data-testid="zoom-frame" @mousemove="moveZoom" @mouseleave="zoom.active = false">
            <img
              ref="mainImage"
              :src="activeImage"
              :alt="product.name"
              class="product-image"
              :style="zoom.active ? { transform: 'scale(2)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined"
              data-testid="main-image"
            >
          </div>
          <div v-if="product.images.length > 1" class="d-flex gap-2 mt-3">
            <button
              v-for="(image, index) in product.images"
              :key="image"
              type="button"
              class="thumbnail"
              :class="{ 'is-selected': image === activeImage }"
              :aria-label="`Show image ${index + 1} of ${product.name}`"
              :aria-pressed="image === activeImage"
              @click="activeImage = image"
            >
              <img :src="image" alt="" class="product-image">
            </button>
          </div>
        </div>

        <div class="col-md-6">
          <p class="eyebrow mb-1">{{ product.brand }}</p>
          <h1 class="product-title">{{ product.name }}</h1>
          <div class="mb-3"><RatingStars :rating="product.rating" :count="product.reviewCount" /></div>
          <p class="text-body-secondary">{{ product.description }}</p>
          <ul class="list-unstyled mb-4">
            <li v-for="highlight in product.highlights" :key="highlight" class="mb-1"><i class="bi bi-check2 text-primary me-2" aria-hidden="true"></i>{{ highlight }}</li>
          </ul>
          <ProductPurchase :product="product" :fly-source="mainImage" @image="activeImage = $event" />
        </div>
      </div>

      <section v-if="bundle" class="mt-5" aria-label="Frequently bought together">
        <BundleOffer :bundle="bundle" heading="Frequently bought together" class="bundle-wide" />
      </section>

      <section v-if="product.specs" class="mt-5" aria-labelledby="specs-heading">
        <h2 id="specs-heading" class="h4 mb-3">Specifications</h2>
        <dl class="specs">
          <div v-for="(value, key) in product.specs" :key="key">
            <dt>{{ key }}</dt>
            <dd>{{ value }}</dd>
          </div>
        </dl>
      </section>

      <ReviewsSection :key="product.id" :product-id="product.id" />

      <section v-if="related.length" class="mt-5" aria-labelledby="related-heading">
        <h2 id="related-heading" class="h4 mb-3">You may also like</h2>
        <ProductGrid :products="related" />
      </section>
    </template>
  </CatalogGate>
</template>

<style scoped>
.product-title {
  font-size: clamp(1.9rem, 4vw, 3rem);
}

.zoom-frame {
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 1.5rem;
  cursor: zoom-in;
}

.zoom-frame img {
  transition: transform 0.2s ease-out;
}

.thumbnail {
  width: 5rem;
  padding: 0;
  overflow: hidden;
  border: 2px solid var(--line);
  border-radius: 0.875rem;
  background: none;
}

.thumbnail.is-selected {
  border-color: var(--accent);
}

.bundle-wide {
  max-width: 36rem;
}

.specs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: 0.75rem;
  margin: 0;
}

.specs > div {
  padding: 0.9rem 1.1rem;
  border: 1px solid var(--line);
  border-radius: 1rem;
  background: var(--surface-1);
}

.specs dt {
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--ink-soft);
}

.specs dd {
  margin: 0;
  font-weight: 600;
}
</style>
