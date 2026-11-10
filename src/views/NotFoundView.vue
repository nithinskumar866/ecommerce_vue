<script setup>
import EmptyState from '@/components/EmptyState.vue';
</script>

<template>
  <EmptyState icon="bi-signpost-split" title="Page not found" message="The page you are looking for does not exist.">
    <router-link to="/products" class="btn btn-primary">Browse products</router-link>
  </EmptyState>
</template>
