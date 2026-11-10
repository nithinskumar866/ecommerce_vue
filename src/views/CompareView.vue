<script setup>
import { computed } from 'vue';
import CatalogGate from '@/components/CatalogGate.vue';
import EmptyState from '@/components/EmptyState.vue';
import RatingStars from '@/components/RatingStars.vue';
import { useCatalogStore } from '@/stores/catalog';
import { useCompareStore } from '@/stores/preferences';
import { formatMoney } from '@/utils/pricing';

const catalog = useCatalogStore();
const compare = useCompareStore();

const products = computed(() => compare.ids.flatMap((id) => catalog.byId.get(id) ?? []));
const specNames = computed(() => [...new Set(products.value.flatMap((product) => Object.keys(product.specs ?? {})))]);
const lowestPrice = computed(() => Math.min(...products.value.map((product) => product.price)));
const highestRating = computed(() => Math.max(...products.value.map((product) => product.rating)));
const canRank = computed(() => products.value.length > 1);
</script>

<template>
  <CatalogGate>
    <h1 class="h2 mb-4">Compare products</h1>
    <EmptyState v-if="!products.length" icon="bi-arrow-left-right" title="Nothing to compare yet" message="Use the compare button on any product to add it here.">
      <router-link to="/products" class="btn btn-primary">Browse products</router-link>
    </EmptyState>

    <div v-else class="table-responsive">
      <table class="table align-middle compare" data-testid="compare-table">
        <thead>
          <tr>
            <td></td>
            <th v-for="product in products" :key="product.id" scope="col">
              <img :src="product.images[0]" :alt="product.name" class="product-image rounded-4 mb-2">
              <router-link :to="`/product/${product.id}`" class="text-body text-decoration-none d-block">{{ product.name }}</router-link>
              <button type="button" class="btn btn-link btn-sm p-0 fw-normal" @click="compare.remove(product.id)">Remove</button>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Price</th>
            <td v-for="product in products" :key="product.id">
              {{ formatMoney(product.price) }}
              <span v-if="canRank && product.price === lowestPrice" class="badge badge-flash ms-1">Lowest</span>
            </td>
          </tr>
          <tr>
            <th scope="row">Rating</th>
            <td v-for="product in products" :key="product.id">
              <RatingStars :rating="product.rating" :count="product.reviewCount" />
              <span v-if="canRank && product.rating === highestRating" class="badge badge-flash ms-1">Top</span>
            </td>
          </tr>
          <tr>
            <th scope="row">Availability</th>
            <td v-for="product in products" :key="product.id">{{ product.stock > 0 ? 'In stock' : 'Out of stock' }}</td>
          </tr>
          <tr v-for="name in specNames" :key="name">
            <th scope="row">{{ name }}</th>
            <td v-for="product in products" :key="product.id">{{ product.specs?.[name] ?? '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </CatalogGate>
</template>

<style scoped>
.compare th[scope='col'] {
  min-width: 11rem;
  vertical-align: top;
}

.compare th[scope='row'] {
  font-weight: 500;
  color: var(--ink-soft);
  white-space: nowrap;
}

.compare img {
  max-width: 12rem;
}
</style>
