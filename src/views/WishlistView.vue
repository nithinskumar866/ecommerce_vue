<script setup>
import { computed } from 'vue';
import CatalogGate from '@/components/CatalogGate.vue';
import EmptyState from '@/components/EmptyState.vue';
import ProductGrid from '@/components/ProductGrid.vue';
import { useCatalogStore } from '@/stores/catalog';
import { useWishlistStore } from '@/stores/preferences';

const catalog = useCatalogStore();
const wishlist = useWishlistStore();
const products = computed(() => wishlist.ids.flatMap((id) => catalog.byId.get(id) ?? []));
</script>

<template>
  <CatalogGate>
    <h1 class="h3 mb-4">Your wishlist</h1>
    <EmptyState v-if="!products.length" icon="bi-heart" title="Your wishlist is empty" message="Tap the heart on any product to save it here.">
      <router-link to="/products" class="btn btn-primary">Browse products</router-link>
    </EmptyState>
    <ProductGrid v-else :products="products" />
  </CatalogGate>
</template>
