import { computed, onBeforeUnmount, ref, toValue } from 'vue';

const pad = (value) => String(value).padStart(2, '0');

export function useCountdown(endsAt) {
  const now = ref(Date.now());
  const timer = setInterval(() => { now.value = Date.now(); }, 1000);
  onBeforeUnmount(() => clearInterval(timer));

  const parts = computed(() => {
    const seconds = Math.max(0, Math.floor(((toValue(endsAt) ?? 0) - now.value) / 1000));
    return {
      hours: pad(Math.floor(seconds / 3600)),
      minutes: pad(Math.floor((seconds % 3600) / 60)),
      seconds: pad(seconds % 60),
    };
  });

  return { parts };
}
