<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CatalogGate from '@/components/CatalogGate.vue';
import EmptyState from '@/components/EmptyState.vue';
import ProductGrid from '@/components/ProductGrid.vue';
import { categories } from '@/data/products';
import { useCatalogStore } from '@/stores/catalog';
import { applyFilters, paginate, parseFilters, sortOptions, toQuery } from '@/utils/catalog';

const route = useRoute();
const router = useRouter();
const catalog = useCatalogStore();

const filtersOpen = ref(false);
const filters = computed(() => parseFilters(route.query));
const matches = computed(() => applyFilters(catalog.products, filters.value));
const current = computed(() => paginate(matches.value, filters.value.page));
const isFiltered = computed(() => Object.keys(toQuery({ ...filters.value, sort: 'featured', page: 1 })).length > 0);

const heading = computed(() => {
  if (filters.value.q) return `Results for "${filters.value.q}"`;
  return categories.find((category) => category.id === filters.value.category)?.label ?? 'All products';
});

// Any filter change returns to page 1.
function update(changes) {
  router.replace({ query: toQuery({ ...filters.value, page: 1, ...changes }) });
}

function goToPage(page) {
  router.push({ query: toQuery({ ...filters.value, page }) });
  window.scrollTo({ top: 0 });
}

function toggleBrand(brand) {
  const { brands } = filters.value;
  update({ brands: brands.includes(brand) ? brands.filter((item) => item !== brand) : [...brands, brand] });
}

function setPrice(field, value) {
  const number = Number(value);
  update({ [field]: value !== '' && number >= 0 ? number : null });
}

function clearAll() {
  router.replace({ query: {} });
}
</script>

<template>
  <CatalogGate>
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
      <div>
        <h1 class="h3 mb-0">{{ heading }}</h1>
        <p class="small text-body-secondary mb-0" role="status" data-testid="result-count">{{ matches.length }} product{{ matches.length === 1 ? '' : 's' }}</p>
      </div>
      <div class="d-flex gap-2">
        <button type="button" class="btn btn-outline-secondary d-lg-none" :aria-expanded="filtersOpen" @click="filtersOpen = !filtersOpen">
          <i class="bi bi-funnel me-1" aria-hidden="true"></i>Filters
        </button>
        <label for="sort" class="visually-hidden">Sort by</label>
        <select id="sort" class="form-select w-auto" :value="filters.sort" @change="update({ sort: $event.target.value })">
          <option v-for="option in sortOptions" :key="option.id" :value="option.id">{{ option.label }}</option>
        </select>
      </div>
    </div>

    <div class="row g-4">
      <aside class="col-lg-3 d-lg-block" :class="{ 'd-none': !filtersOpen }" aria-label="Filters">
        <div class="card card-body">
          <div class="mb-4">
            <label for="filter-category" class="form-label fw-semibold">Category</label>
            <select id="filter-category" class="form-select form-select-sm" :value="filters.category" @change="update({ category: $event.target.value })">
              <option value="">All categories</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.label }}</option>
            </select>
          </div>

          <fieldset class="mb-4">
            <legend class="fs-6 fw-semibold">Brand</legend>
            <div v-for="brand in catalog.brands" :key="brand" class="form-check">
              <input :id="`brand-${brand}`" class="form-check-input" type="checkbox" :checked="filters.brands.includes(brand)" @change="toggleBrand(brand)">
              <label class="form-check-label small" :for="`brand-${brand}`">{{ brand }}</label>
            </div>
          </fieldset>

          <fieldset class="mb-4">
            <legend class="fs-6 fw-semibold">Price (₹)</legend>
            <div class="d-flex gap-2">
              <input class="form-control form-control-sm" type="number" min="0" placeholder="Min" aria-label="Minimum price" :value="filters.min" @change="setPrice('min', $event.target.value)">
              <input class="form-control form-control-sm" type="number" min="0" placeholder="Max" aria-label="Maximum price" :value="filters.max" @change="setPrice('max', $event.target.value)">
            </div>
          </fieldset>

          <div class="mb-4">
            <label for="filter-rating" class="form-label fw-semibold">Rating</label>
            <select id="filter-rating" class="form-select form-select-sm" :value="filters.rating ?? ''" @change="update({ rating: $event.target.value === '' ? null : Number($event.target.value) })">
              <option value="">Any rating</option>
              <option value="4">4 stars and up</option>
              <option value="3">3 stars and up</option>
            </select>
          </div>

          <div class="form-check form-switch mb-3">
            <input id="filter-stock" class="form-check-input" type="checkbox" role="switch" :checked="filters.inStock" @change="update({ inStock: $event.target.checked })">
            <label class="form-check-label small" for="filter-stock">In stock only</label>
          </div>

          <button v-if="isFiltered" type="button" class="btn btn-link btn-sm p-0 text-start" @click="clearAll">Clear all filters</button>
        </div>
      </aside>

      <div class="col-lg-9">
        <EmptyState v-if="!matches.length" icon="bi-search" title="No products found" message="Try removing a filter or searching for something else.">
          <button type="button" class="btn btn-primary" @click="clearAll">Clear filters</button>
        </EmptyState>
        <template v-else>
          <ProductGrid :products="current.items" columns="col-6 col-md-4" />
          <nav v-if="current.pageCount > 1" class="mt-4" aria-label="Pagination">
            <ul class="pagination justify-content-center">
              <li v-for="page in current.pageCount" :key="page" class="page-item" :class="{ active: page === current.page }">
                <button type="button" class="page-link" :aria-current="page === current.page ? 'page' : undefined" @click="goToPage(page)">{{ page }}</button>
              </li>
            </ul>
          </nav>
        </template>
      </div>
    </div>
  </CatalogGate>
</template>
