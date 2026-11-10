<script setup>
import { computed, ref, watch } from 'vue';
import AreaChart from '@/components/AreaChart.vue';
import BarList from '@/components/BarList.vue';
import EmptyState from '@/components/EmptyState.vue';
import { adminApi } from '@/api/admin';
import { useLoad } from '@/composables/useLoad';
import { formatCompactMoney, formatMoney } from '@/utils/pricing';

const ranges = [7, 30, 60];
const days = ref(30);
const showTable = ref(false);
const refreshing = ref(false);

const { data, status, error, reload } = useLoad(() => adminApi.dashboard(days.value));

// Keeps the previous charts on screen, dimmed, while the new range loads.
watch(days, async () => {
  refreshing.value = true;
  await reload({ quiet: true });
  refreshing.value = false;
});

const revenuePoints = computed(() => data.value.series.map(({ date, revenue }) => ({ date, value: revenue })));
const categoryRows = computed(() => data.value.categories.map(({ id, label, revenue }) => ({ id, label, value: revenue })));

const number = new Intl.NumberFormat('en-IN');

function delta(metric) {
  const current = data.value.totals[metric];
  const previous = data.value.previous[metric];
  return previous ? ((current - previous) / previous) * 100 : 0;
}

const tiles = computed(() => [
  { label: 'Orders', value: number.format(data.value.totals.orders), change: delta('orders') },
  { label: 'Average order', value: formatCompactMoney(data.value.totals.averageOrder), change: delta('averageOrder') },
  { label: 'Units sold', value: number.format(data.value.totals.units), change: delta('units') },
]);

const signed = (value) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
const shortDate = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
</script>

<template>
  <div class="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
    <div>
      <p class="eyebrow mb-1">Store admin</p>
      <h1 class="h2 mb-0">Dashboard</h1>
    </div>
  </div>

  <p v-if="status === 'loading'" class="text-body-secondary" role="status">Loading dashboard…</p>
  <EmptyState v-else-if="status === 'error'" icon="bi-lock" title="Dashboard unavailable" :message="error" />

  <template v-else>
    <div class="d-flex flex-wrap align-items-center gap-2 mb-4">
      <div class="btn-group" role="group" aria-label="Date range">
        <button
          v-for="range in ranges"
          :key="range"
          type="button"
          class="btn btn-sm"
          :class="range === days ? 'btn-primary' : 'btn-outline-secondary'"
          :aria-pressed="range === days"
          @click="days = range"
        >{{ range }} days</button>
      </div>
      <button type="button" class="btn btn-outline-secondary btn-sm" :aria-pressed="showTable" @click="showTable = !showTable">
        <i class="bi me-1" :class="showTable ? 'bi-graph-up' : 'bi-table'" aria-hidden="true"></i>{{ showTable ? 'View charts' : 'View as table' }}
      </button>
    </div>

    <div class="dashboard" :class="{ 'is-refreshing': refreshing }">
      <div class="row g-3 mb-3">
        <div class="col-lg-5">
          <div class="card card-body h-100">
            <span class="tile-label">Revenue, last {{ days }} days</span>
            <span class="hero-figure" data-testid="hero-revenue">{{ formatCompactMoney(data.totals.revenue) }}</span>
            <span class="small">
              <i class="bi" :class="delta('revenue') >= 0 ? 'bi-arrow-up-right' : 'bi-arrow-down-right'" aria-hidden="true"></i>
              {{ signed(delta('revenue')) }} <span class="text-body-secondary">vs previous {{ days }} days</span>
            </span>
          </div>
        </div>
        <div v-for="tile in tiles" :key="tile.label" class="col-sm-4 col-lg">
          <div class="card card-body h-100">
            <span class="tile-label">{{ tile.label }}</span>
            <span class="tile-value">{{ tile.value }}</span>
            <span class="small">
              <i class="bi" :class="tile.change >= 0 ? 'bi-arrow-up-right' : 'bi-arrow-down-right'" aria-hidden="true"></i>
              {{ signed(tile.change) }}
            </span>
          </div>
        </div>
      </div>

      <div class="row g-3 mb-3">
        <div class="col-lg-8">
          <section class="card card-body h-100" aria-labelledby="revenue-heading">
            <h2 id="revenue-heading" class="h6">Daily revenue</h2>
            <AreaChart
              v-if="!showTable"
              :points="revenuePoints"
              :format-value="formatMoney"
              :format-tick="formatCompactMoney"
              :label="`Line chart of daily revenue over the last ${days} days, totalling ${formatCompactMoney(data.totals.revenue)}. Use the left and right arrow keys to read each day.`"
            />
            <div v-else class="table-scroll" tabindex="0">
              <table class="table table-sm mb-0" data-testid="revenue-table">
                <thead><tr><th scope="col">Date</th><th scope="col" class="text-end">Revenue</th><th scope="col" class="text-end">Orders</th></tr></thead>
                <tbody>
                  <tr v-for="day in [...data.series].reverse()" :key="day.date">
                    <td>{{ shortDate(day.date) }}</td>
                    <td class="text-end numeric">{{ formatMoney(day.revenue) }}</td>
                    <td class="text-end numeric">{{ number.format(day.orders) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
        <div class="col-lg-4">
          <section class="card card-body h-100" aria-labelledby="category-heading">
            <h2 id="category-heading" class="h6">Revenue by category</h2>
            <BarList v-if="!showTable" :rows="categoryRows" :format-value="formatCompactMoney" />
            <table v-else class="table table-sm mb-0">
              <thead><tr><th scope="col">Category</th><th scope="col" class="text-end">Revenue</th></tr></thead>
              <tbody>
                <tr v-for="row in categoryRows" :key="row.id"><td>{{ row.label }}</td><td class="text-end numeric">{{ formatMoney(row.value) }}</td></tr>
              </tbody>
            </table>
          </section>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-lg-8">
          <section class="card card-body h-100" aria-labelledby="top-heading">
            <h2 id="top-heading" class="h6">Top products</h2>
            <table class="table align-middle mb-0">
              <thead><tr><th scope="col">Product</th><th scope="col" class="text-end">Units</th><th scope="col" class="text-end">Revenue</th></tr></thead>
              <tbody>
                <tr v-for="product in data.topProducts" :key="product.id" data-testid="top-product">
                  <td>
                    <img :src="product.image" alt="" width="36" height="36" class="rounded me-2 top-thumb">
                    <router-link :to="`/product/${product.id}`" class="text-body text-decoration-none">{{ product.name }}</router-link>
                  </td>
                  <td class="text-end numeric">{{ number.format(product.units) }}</td>
                  <td class="text-end numeric">{{ formatCompactMoney(product.revenue) }}</td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>
        <div class="col-lg-4">
          <section class="card card-body h-100" aria-labelledby="stock-heading">
            <h2 id="stock-heading" class="h6">Low stock</h2>
            <ul class="list-unstyled mb-0">
              <li v-for="item in data.lowStock" :key="item.id" class="d-flex justify-content-between py-1 small" data-testid="low-stock">
                <span>{{ item.name }}</span>
                <span class="fw-semibold">
                  <i class="bi me-1" :class="item.stock ? 'bi-exclamation-triangle text-warning' : 'bi-x-octagon text-danger'" aria-hidden="true"></i>{{ item.stock ? `${item.stock} left` : 'Sold out' }}
                </span>
              </li>
            </ul>
          </section>
        </div>
      </div>

      <p class="small text-body-secondary mt-3 mb-0">
        Figures are simulated, plus {{ data.liveOrderCount }} real order{{ data.liveOrderCount === 1 ? '' : 's' }} placed in this browser during this period.
      </p>
    </div>
  </template>
</template>

<style scoped>
.dashboard {
  transition: opacity 0.2s ease;
}

.dashboard.is-refreshing {
  opacity: 0.55;
}

.tile-label {
  font-size: 0.85rem;
  color: var(--ink-soft);
}

.tile-value {
  font-size: 1.75rem;
  font-weight: 600;
}

.hero-figure {
  font-size: clamp(3rem, 6vw, 4rem);
  font-weight: 600;
  line-height: 1.1;
}

.numeric {
  font-variant-numeric: tabular-nums;
}

.top-thumb {
  object-fit: cover;
}

.table-scroll {
  max-height: 284px;
  overflow-y: auto;
}
</style>
