<script setup>
defineProps({
  label: { type: String, required: true },
  min: { type: Number, default: 1 },
  max: { type: Number, required: true },
});
const quantity = defineModel({ type: Number, required: true });
</script>

<template>
  <div class="input-group input-group-sm flex-nowrap" style="width: 7.5rem" role="group" :aria-label="`Quantity of ${label}`">
    <button type="button" class="btn btn-outline-secondary" :disabled="quantity <= min" aria-label="Decrease quantity" @click="quantity -= 1">
      <i class="bi bi-dash" aria-hidden="true"></i>
    </button>
    <span class="input-group-text flex-grow-1 justify-content-center" aria-live="polite" data-testid="quantity">{{ quantity }}</span>
    <button type="button" class="btn btn-outline-secondary" :disabled="quantity >= max" aria-label="Increase quantity" @click="quantity += 1">
      <i class="bi bi-plus" aria-hidden="true"></i>
    </button>
  </div>
</template>
