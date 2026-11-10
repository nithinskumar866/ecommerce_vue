<script setup>
import { computed } from 'vue';

const props = defineProps({
  rating: { type: Number, required: true },
  count: { type: Number, default: null },
});

const stars = computed(() => [1, 2, 3, 4, 5].map((star) => {
  if (props.rating >= star) return 'bi-star-fill';
  return props.rating >= star - 0.5 ? 'bi-star-half' : 'bi-star';
}));
</script>

<template>
  <span class="small text-nowrap" :aria-label="`Rated ${rating} out of 5`" role="img">
    <i v-for="(star, index) in stars" :key="index" class="bi text-warning" :class="star" aria-hidden="true"></i>
    <span v-if="count !== null" class="text-body-secondary ms-1" aria-hidden="true">({{ count }})</span>
  </span>
</template>
