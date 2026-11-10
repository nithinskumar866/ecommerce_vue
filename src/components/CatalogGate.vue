<script setup>
import { useCatalogStore } from '@/stores/catalog';
import EmptyState from './EmptyState.vue';
import ProductSkeletons from './ProductSkeletons.vue';

const catalog = useCatalogStore();
</script>

<template>
  <slot v-if="catalog.status === 'ready'" />
  <EmptyState
    v-else-if="catalog.status === 'error'"
    icon="bi-wifi-off"
    title="We couldn't load the store"
    message="Please check your connection and try again."
  >
    <button type="button" class="btn btn-primary" @click="catalog.load()">Try again</button>
  </EmptyState>
  <ProductSkeletons v-else />
</template>
