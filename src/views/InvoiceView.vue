<script setup>
import { useRoute } from 'vue-router';
import EmptyState from '@/components/EmptyState.vue';
import TotalsList from '@/components/TotalsList.vue';
import { ordersApi } from '@/api/orders';
import { useLoad } from '@/composables/useLoad';
import { formatMoney } from '@/utils/pricing';

const route = useRoute();
const { data: order, status, error } = useLoad(() => ordersApi.get(route.params.id));
const formatDate = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
const print = () => window.print();
</script>

<template>
  <p v-if="status === 'loading'" class="text-body-secondary" role="status">Loading invoice…</p>
  <EmptyState v-else-if="status === 'error'" icon="bi-receipt" title="Invoice not available" :message="error" />

  <div v-else class="card card-body mx-auto" style="max-width: 48rem" data-testid="invoice">
    <div class="d-flex justify-content-between align-items-start mb-4">
      <div>
        <h1 class="h4 mb-1">Invoice</h1>
        <p class="small text-body-secondary mb-0">Vue E-Commerce (demo: not a tax document)</p>
      </div>
      <div class="text-end small">
        <strong>{{ order.id }}</strong><br>{{ formatDate(order.createdAt) }}
        <span v-if="order.cancelledAt" class="badge text-bg-secondary d-block mt-1">Cancelled</span>
      </div>
    </div>

    <p class="small">
      <strong>Billed to:</strong> {{ order.address.name }}, {{ order.address.line1 }}<template v-if="order.address.line2">, {{ order.address.line2 }}</template>, {{ order.address.city }}, {{ order.address.state }} {{ order.address.pincode }}
    </p>

    <table class="table">
      <thead>
        <tr><th scope="col">Item</th><th scope="col" class="text-end">Price</th><th scope="col" class="text-end">Qty</th><th scope="col" class="text-end">Amount</th></tr>
      </thead>
      <tbody>
        <tr v-for="item in order.items" :key="`${item.productId}-${item.color}-${item.storage}`">
          <td>{{ item.name }}<small v-if="item.variantLabel" class="d-block text-body-secondary">{{ item.variantLabel }}</small></td>
          <td class="text-end">{{ formatMoney(item.price) }}</td>
          <td class="text-end">{{ item.quantity }}</td>
          <td class="text-end">{{ formatMoney(item.price * item.quantity) }}</td>
        </tr>
      </tbody>
    </table>

    <div class="ms-auto" style="min-width: 18rem"><TotalsList :totals="order.totals" /></div>

    <div class="no-print mt-4 d-flex justify-content-between">
      <router-link :to="`/orders/${order.id}`" class="btn btn-link px-0">Back to order</router-link>
      <button type="button" class="btn btn-primary" @click="print"><i class="bi bi-printer me-1" aria-hidden="true"></i>Print</button>
    </div>
  </div>
</template>
