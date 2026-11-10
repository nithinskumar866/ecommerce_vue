<script setup>
import { useCountdown } from '@/composables/useCountdown';

const props = defineProps({ endsAt: { type: Number, required: true } });
const { parts } = useCountdown(() => props.endsAt);
</script>

<template>
  <span class="countdown" role="timer" :aria-label="`Sale ends in ${parts.hours} hours ${parts.minutes} minutes`" data-testid="countdown">
    <span class="countdown__cell" aria-hidden="true">{{ parts.hours }}</span>
    <span aria-hidden="true">:</span>
    <span class="countdown__cell" aria-hidden="true">{{ parts.minutes }}</span>
    <span aria-hidden="true">:</span>
    <span class="countdown__cell" aria-hidden="true">{{ parts.seconds }}</span>
  </span>
</template>

<style scoped>
.countdown {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-family: var(--display-font);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.countdown__cell {
  min-width: 2.2em;
  padding: 0.2em 0.35em;
  border-radius: 0.5rem;
  background: var(--accent);
  color: var(--accent-ink);
  text-align: center;
}
</style>
