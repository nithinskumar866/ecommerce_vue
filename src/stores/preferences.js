import { computed, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { onStorageChange, readStorage, writeStorage } from '@/utils/storage';

const MAX_RECENT = 8;
export const MAX_COMPARE = 4;

const readIds = (key) => {
  const saved = readStorage(key, []);
  return Array.isArray(saved) ? saved.filter(Number.isInteger) : [];
};

export const useWishlistStore = defineStore('wishlist', () => {
  const ids = ref(readIds('wishlist'));
  watch(ids, (value) => writeStorage('wishlist', value), { deep: true });
  onStorageChange('wishlist', () => { ids.value = readIds('wishlist'); });

  const count = computed(() => ids.value.length);
  const has = (id) => ids.value.includes(id);

  // Returns true when the product is now on the wishlist.
  function toggle(id) {
    const adding = !has(id);
    ids.value = adding ? [...ids.value, id] : ids.value.filter((item) => item !== id);
    return adding;
  }

  return { ids, count, has, toggle };
});

export const useCompareStore = defineStore('compare', () => {
  const ids = ref(readIds('compare').slice(0, MAX_COMPARE));
  watch(ids, (value) => writeStorage('compare', value), { deep: true });
  onStorageChange('compare', () => { ids.value = readIds('compare').slice(0, MAX_COMPARE); });

  const count = computed(() => ids.value.length);
  const has = (id) => ids.value.includes(id);
  const isFull = computed(() => ids.value.length >= MAX_COMPARE);

  function remove(id) {
    ids.value = ids.value.filter((item) => item !== id);
  }

  // Returns false when the comparison is already full.
  function toggle(id) {
    if (has(id)) {
      remove(id);
      return true;
    }
    if (isFull.value) return false;
    ids.value = [...ids.value, id];
    return true;
  }

  function clear() {
    ids.value = [];
  }

  return { ids, count, has, isFull, toggle, remove, clear };
});

export const useRecentlyViewedStore = defineStore('recentlyViewed', () => {
  const ids = ref(readIds('recent'));
  watch(ids, (value) => writeStorage('recent', value), { deep: true });

  function record(id) {
    ids.value = [id, ...ids.value.filter((item) => item !== id)].slice(0, MAX_RECENT);
  }

  return { ids, record };
});

// The store's look is designed dark-first, so dark is the default for new visitors.
function initialTheme() {
  const saved = readStorage('theme', null);
  return saved === 'light' || saved === 'dark' ? saved : 'dark';
}

export const useThemeStore = defineStore('theme', () => {
  const mode = ref(initialTheme());
  watch(mode, (value) => {
    document.documentElement.dataset.bsTheme = value;
    writeStorage('theme', value);
  }, { immediate: true });

  function toggle() {
    mode.value = mode.value === 'dark' ? 'light' : 'dark';
  }

  return { mode, toggle };
});
