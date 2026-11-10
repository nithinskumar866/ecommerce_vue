<script setup>
import ProductCard from './ProductCard.vue';

defineProps({
  products: { type: Array, required: true },
  columns: { type: String, default: 'col-6 col-md-4 col-lg-3' },
});
</script>

<template>
  <div class="row g-3">
    <div v-for="product in products" :key="product.id" :class="columns">
      <ProductCard :product="product" />
    </div>
  </div>
</template>
