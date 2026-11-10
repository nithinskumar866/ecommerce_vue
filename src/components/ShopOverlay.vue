<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';

const props = defineProps({
  open: { type: Boolean, required: true },
  label: { type: String, required: true },
  variant: { type: String, default: 'drawer' },
});
const emit = defineEmits(['close']);

const panel = ref(null);
let returnFocusTo = null;

function unlockScroll() {
  document.body.style.overflow = '';
}

watch(() => props.open, async (open) => {
  if (open) {
    returnFocusTo = document.activeElement;
    document.body.style.overflow = 'hidden';
    await nextTick();
    panel.value?.focus();
  } else {
    unlockScroll();
    returnFocusTo?.focus?.();
  }
});

onBeforeUnmount(unlockScroll);

function trapTab(event) {
  const focusable = [...panel.value.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select, textarea')];
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const current = document.activeElement;
  if (event.shiftKey && (current === first || current === panel.value)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && current === last) {
    event.preventDefault();
    first.focus();
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="overlay">
      <div
        v-if="open"
        class="overlay no-print"
        :class="`overlay--${variant}`"
        @keydown.esc="emit('close')"
        @keydown.tab="trapTab"
      >
        <div class="overlay__backdrop" data-testid="overlay-backdrop" @click="emit('close')"></div>
        <div ref="panel" class="overlay__panel" role="dialog" aria-modal="true" :aria-label="label" tabindex="-1">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
