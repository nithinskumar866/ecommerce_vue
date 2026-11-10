<script setup>
defineProps({ count: { type: Number, default: 8 } });
</script>

<template>
  <div class="row g-3" role="status" aria-label="Loading">
    <div v-for="n in count" :key="n" class="col-6 col-md-4 col-lg-3">
      <div class="skeleton" style="height: 18rem"></div>
    </div>
  </div>
</template>
