<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useCatalogStore } from '@/stores/catalog';
import { MAX_COMPARE, useCompareStore } from '@/stores/preferences';

const route = useRoute();
const catalog = useCatalogStore();
const compare = useCompareStore();

const products = computed(() => compare.ids.flatMap((id) => catalog.byId.get(id) ?? []));
const visible = computed(() => products.value.length > 0 && route.path !== '/compare');
</script>

<template>
  <Transition name="tray">
    <aside v-if="visible" class="tray no-print" aria-label="Products to compare" data-testid="compare-tray">
      <div class="d-flex gap-2">
        <button
          v-for="product in products"
          :key="product.id"
          type="button"
          class="tray__thumb"
          :aria-label="`Remove ${product.name} from comparison`"
          @click="compare.remove(product.id)"
        >
          <img :src="product.images[0]" alt="">
        </button>
      </div>
      <span class="small text-body-secondary d-none d-sm-inline">{{ products.length }} of {{ MAX_COMPARE }}</span>
      <router-link to="/compare" class="btn btn-primary btn-sm">Compare</router-link>
      <button type="button" class="btn btn-link btn-sm text-body-secondary p-0" @click="compare.clear()">Clear</button>
    </aside>
  </Transition>
</template>

<style scoped>
.tray {
  position: fixed;
  z-index: 1040;
  left: 50%;
  bottom: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.5rem 1rem 0.5rem 0.6rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--glass);
  backdrop-filter: blur(16px);
  box-shadow: var(--shadow);
  transform: translateX(-50%);
}

.tray__thumb {
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 50%;
  overflow: hidden;
  background: none;
}

.tray__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tray-enter-active,
.tray-leave-active {
  transition: opacity 0.25s ease, transform 0.35s var(--ease);
}

.tray-enter-from,
.tray-leave-to {
  opacity: 0;
  transform: translate(-50%, 24px);
}
</style>
