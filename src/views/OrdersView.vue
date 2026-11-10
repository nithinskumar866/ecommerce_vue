<script setup>
import EmptyState from '@/components/EmptyState.vue';
import { ordersApi } from '@/api/orders';
import { useLoad } from '@/composables/useLoad';
import { statusLabel } from '@/utils/orderStatus';
import { formatMoney } from '@/utils/pricing';

const { data: orders, status, error, reload } = useLoad(() => ordersApi.list());
const formatDate = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
</script>

<template>
  <h1 class="h3 mb-4">My orders</h1>
  <p v-if="status === 'loading'" class="text-body-secondary" role="status">Loading your orders…</p>
  <EmptyState v-else-if="status === 'error'" icon="bi-exclamation-triangle" title="We couldn't load your orders" :message="error">
    <button type="button" class="btn btn-primary" @click="reload()">Try again</button>
  </EmptyState>
  <EmptyState v-else-if="!orders.length" icon="bi-bag" title="No orders yet" message="When you place an order, it will show up here.">
    <router-link to="/products" class="btn btn-primary">Start shopping</router-link>
  </EmptyState>
  <router-link
    v-for="order in orders"
    v-else
    :key="order.id"
    :to="`/orders/${order.id}`"
    class="card card-body mb-3 text-decoration-none"
    data-testid="order-row"
  >
    <div class="d-flex flex-wrap justify-content-between gap-2">
      <div>
        <strong>{{ order.id }}</strong>
        <div class="small text-body-secondary">{{ formatDate(order.createdAt) }} · {{ order.items.length }} item{{ order.items.length === 1 ? '' : 's' }}</div>
      </div>
      <div class="text-end">
        <span class="badge" :class="order.cancelledAt ? 'text-bg-secondary' : 'text-bg-primary'">{{ statusLabel(order) }}</span>
        <div class="fw-bold">{{ formatMoney(order.totals.total) }}</div>
      </div>
    </div>
  </router-link>
</template>
