<script setup>
import { computed } from 'vue';

const props = defineProps({
  // [{ id, label, value }], already sorted
  rows: { type: Array, required: true },
  formatValue: { type: Function, required: true },
});

const max = computed(() => Math.max(...props.rows.map((row) => row.value), 1));
</script>

<template>
  <ul class="bars list-unstyled mb-0" data-testid="bar-list">
    <li v-for="row in rows" :key="row.id" class="bars__row" tabindex="0">
      <span class="bars__label">{{ row.label }}</span>
      <span class="bars__track">
        <span class="bars__bar" :style="{ width: `${(row.value / max) * 100}%` }"></span>
      </span>
      <span class="bars__value">{{ formatValue(row.value) }}</span>
    </li>
  </ul>
</template>

<style scoped>
.bars__row {
  display: grid;
  grid-template-columns: 8.5rem 1fr 4.5rem;
  align-items: center;
  gap: 0.75rem;
  padding: 0.45rem 0.3rem;
  border-radius: 0.5rem;
}

.bars__row:hover,
.bars__row:focus-visible {
  background: var(--surface-2);
}

.bars__label {
  font-size: 0.85rem;
  color: var(--ink-soft);
}

.bars__bar {
  display: block;
  height: 16px;
  border-radius: 0 4px 4px 0;
  background: var(--chart);
}

.bars__value {
  font-size: 0.85rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  text-align: right;
}
</style>
