<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCatalogStore } from '@/stores/catalog';
import { applyFilters, parseFilters } from '@/utils/catalog';
import { formatMoney } from '@/utils/pricing';

const MAX_SUGGESTIONS = 6;

const route = useRoute();
const router = useRouter();
const catalog = useCatalogStore();

const query = ref('');
const open = ref(false);
const active = ref(-1);

const suggestions = computed(() => {
  const q = query.value.trim();
  return q ? applyFilters(catalog.products, parseFilters({ q })).slice(0, MAX_SUGGESTIONS) : [];
});
const showPanel = computed(() => open.value && query.value.trim() !== '');

watch(() => route.fullPath, () => {
  open.value = false;
  active.value = -1;
  query.value = route.path === '/products' ? String(route.query.q ?? '') : '';
}, { immediate: true });
watch(query, () => { active.value = -1; });

function goToResults() {
  const q = query.value.trim();
  open.value = false;
  router.push({ path: '/products', query: q ? { q } : {} });
}

function openProduct(product) {
  open.value = false;
  router.push(`/product/${product.id}`);
}

function submit() {
  if (active.value >= 0) openProduct(suggestions.value[active.value]);
  else goToResults();
}

function move(step) {
  if (!suggestions.value.length) return;
  open.value = true;
  const size = suggestions.value.length;
  active.value = active.value === -1 && step < 0 ? size - 1 : (active.value + step + size) % size;
}
</script>

<template>
  <form class="search" role="search" @submit.prevent="submit">
    <i class="bi bi-search search__icon" aria-hidden="true"></i>
    <input
      v-model="query"
      type="text"
      class="form-control search__input"
      placeholder="Search phones, audio, smart home…"
      role="combobox"
      aria-label="Search products"
      aria-autocomplete="list"
      aria-controls="search-suggestions"
      :aria-expanded="showPanel"
      :aria-activedescendant="active >= 0 ? `suggestion-${active}` : undefined"
      autocomplete="off"
      @focus="open = true"
      @input="open = true"
      @blur="open = false"
      @keydown.down.prevent="move(1)"
      @keydown.up.prevent="move(-1)"
      @keydown.esc="open = false"
    >
    <!-- mousedown.prevent keeps focus in the input so blur doesn't close the list before a click lands -->
    <div v-show="showPanel" class="search__panel" @mousedown.prevent>
      <ul id="search-suggestions" class="list-unstyled mb-0" role="listbox" aria-label="Suggestions">
        <li
          v-for="(product, index) in suggestions"
          :id="`suggestion-${index}`"
          :key="product.id"
          class="search__option"
          :class="{ 'is-active': index === active }"
          role="option"
          :aria-selected="index === active"
          data-testid="suggestion"
          @click="openProduct(product)"
          @mouseenter="active = index"
        >
          <img :src="product.images[0]" alt="" width="44" height="44">
          <span class="flex-grow-1 text-truncate">{{ product.name }}</span>
          <strong class="small">{{ formatMoney(product.price) }}</strong>
        </li>
      </ul>
      <p v-if="!suggestions.length" class="small text-body-secondary m-0 p-3">No matches for "{{ query.trim() }}".</p>
      <button v-else type="button" class="btn btn-link btn-sm w-100" @click="goToResults">See all results</button>
    </div>
  </form>
</template>

<style scoped>
.search {
  position: relative;
  flex: 1;
}

.search__icon {
  position: absolute;
  top: 50%;
  left: 1rem;
  transform: translateY(-50%);
  color: var(--ink-soft);
  pointer-events: none;
}

.search__input {
  padding-left: 2.6rem;
  border-radius: 999px;
}

.search__panel {
  position: absolute;
  z-index: 1100;
  top: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  padding: 0.4rem;
  background: var(--surface-1);
  border: 1px solid var(--line);
  border-radius: 1rem;
  box-shadow: var(--shadow);
}

.search__option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.4rem 0.6rem;
  border-radius: 0.75rem;
  color: var(--ink);
  cursor: pointer;
}

.search__option img {
  object-fit: cover;
  border-radius: 0.5rem;
}

.search__option.is-active {
  background: var(--surface-2);
}
</style>
