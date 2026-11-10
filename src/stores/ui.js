import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useUiStore = defineStore('ui', () => {
  const cartOpen = ref(false);
  const quickViewId = ref(null);
  // Bumped on each add so the header can replay its cart animation.
  const cartPulse = ref(0);

  function closeAll() {
    cartOpen.value = false;
    quickViewId.value = null;
  }

  return { cartOpen, quickViewId, cartPulse, closeAll };
});
