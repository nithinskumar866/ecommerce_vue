<script setup>
defineProps({
  icon: { type: String, default: 'bi-inbox' },
  title: { type: String, required: true },
  message: { type: String, default: '' },
});
</script>

<template>
  <div class="text-center py-5">
    <i class="bi fs-1 text-body-secondary" :class="icon" aria-hidden="true"></i>
    <h2 class="h4 mt-3">{{ title }}</h2>
    <p v-if="message" class="text-body-secondary">{{ message }}</p>
    <slot />
  </div>
</template>
