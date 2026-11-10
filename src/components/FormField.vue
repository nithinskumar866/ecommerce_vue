<script setup>
defineOptions({ inheritAttrs: false });
defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  error: { type: String, default: '' },
});
const value = defineModel({ type: String, default: '' });
</script>

<template>
  <div class="mb-3">
    <label :for="id" class="form-label">{{ label }}</label>
    <input
      :id="id"
      v-model="value"
      v-bind="$attrs"
      class="form-control"
      :class="{ 'is-invalid': error }"
      :aria-invalid="Boolean(error)"
      :aria-describedby="error ? `${id}-error` : undefined"
    >
    <div v-if="error" :id="`${id}-error`" class="invalid-feedback">{{ error }}</div>
  </div>
</template>
