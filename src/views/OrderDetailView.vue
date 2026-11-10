<script setup>
import { computed, onBeforeUnmount, ref } from 'vue';
import { useRoute } from 'vue-router';
import { notify } from '@kyvg/vue3-notification';
import EmptyState from '@/components/EmptyState.vue';
import TotalsList from '@/components/TotalsList.vue';
import { errorMessage } from '@/api/client';
import { ordersApi } from '@/api/orders';
import { useLoad } from '@/composables/useLoad';
import { useAuthStore } from '@/stores/auth';
import { useCatalogStore } from '@/stores/catalog';
import { canCancel, currentStepIndex, orderSteps } from '@/utils/orderStatus';
import { deliveryOptions, formatMoney } from '@/utils/pricing';

const route = useRoute();
const catalog = useCatalogStore();
const auth = useAuthStore();
const { data: order, status, error, reload } = useLoad(() => ordersApi.get(route.params.id));

const now = ref(Date.now());
const timer = setInterval(() => { now.value = Date.now(); }, 5000);
onBeforeUnmount(() => clearInterval(timer));

const stepIndex = computed(() => currentStepIndex(order.value, now.value));
const cancellable = computed(() => canCancel(order.value, now.value));
const delivery = computed(() => deliveryOptions.find((option) => option.id === order.value.deliveryId));
const paymentText = computed(() => {
  const { method, last4, upiId } = order.value.payment;
  if (method === 'card') return `Card ending in ${last4}`;
  return method === 'upi' ? `UPI (${upiId})` : 'Cash on Delivery';
});

async function cancelOrder() {
  try {
    await ordersApi.cancel(order.value.id);
    await Promise.all([reload({ quiet: true }), catalog.load({ force: true }), auth.init()]);
    notify({ title: 'Order cancelled', type: 'success' });
  } catch (cause) {
    notify({ title: 'Could not cancel', text: errorMessage(cause), type: 'error' });
  }
}
</script>

<template>
  <p v-if="status === 'loading'" class="text-body-secondary" role="status">Loading order…</p>
  <EmptyState v-else-if="status === 'error'" icon="bi-receipt" title="Order not available" :message="error">
    <router-link to="/orders" class="btn btn-primary">My orders</router-link>
  </EmptyState>

  <template v-else>
    <div v-if="route.query.placed && !order.cancelledAt" class="alert alert-success" role="status" data-testid="order-success">
      <strong>Thank you for your order!</strong> This is a demo, so no payment was taken.
      <template v-if="order.pointsEarned"> You earned <strong data-testid="points-earned">{{ order.pointsEarned }} points</strong>.</template>
    </div>

    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
      <h1 class="h3 mb-0" data-testid="order-id">Order {{ order.id }}</h1>
      <div class="d-flex gap-2">
        <router-link :to="`/orders/${order.id}/invoice`" class="btn btn-outline-primary">Invoice</router-link>
        <button v-if="cancellable" type="button" class="btn btn-outline-danger" @click="cancelOrder">Cancel order</button>
      </div>
    </div>

    <div v-if="order.cancelledAt" class="alert alert-secondary" data-testid="order-cancelled">This order was cancelled.</div>
    <ol v-else class="row list-unstyled text-center mb-4" aria-label="Order progress">
      <li v-for="(step, index) in orderSteps" :key="step.id" class="col" :aria-current="index === stepIndex ? 'step' : undefined">
        <i class="bi fs-3" :class="[step.icon, index <= stepIndex ? 'text-primary' : 'text-body-tertiary']" aria-hidden="true"></i>
        <div class="small" :class="{ 'fw-semibold': index === stepIndex }">{{ step.label }}</div>
      </li>
    </ol>

    <div class="row g-4">
      <div class="col-lg-8">
        <div class="card card-body">
          <div v-for="item in order.items" :key="`${item.productId}-${item.color}-${item.storage}`" class="d-flex align-items-center gap-3 mb-3">
            <img :src="item.image ?? catalog.byId.get(item.productId)?.images[0]" :alt="item.name" class="product-image rounded" style="width: 4rem">
            <div class="flex-grow-1">
              <router-link :to="`/product/${item.productId}`" class="text-body text-decoration-none">{{ item.name }}</router-link>
              <div v-if="item.variantLabel" class="small text-body-secondary">{{ item.variantLabel }}</div>
              <div class="small text-body-secondary">{{ formatMoney(item.price) }} × {{ item.quantity }}</div>
            </div>
            <strong>{{ formatMoney(item.price * item.quantity) }}</strong>
          </div>
          <hr>
          <div class="row">
            <div class="col-md-7 mb-3 mb-md-0">
              <h2 class="h6 fw-bold">Delivering to</h2>
              <p class="small mb-0">
                {{ order.address.name }}, {{ order.address.phone }}<br>
                {{ order.address.line1 }}<template v-if="order.address.line2">, {{ order.address.line2 }}</template>, {{ order.address.city }}, {{ order.address.state }} {{ order.address.pincode }}
              </p>
            </div>
            <div class="col-md-5">
              <h2 class="h6 fw-bold">Delivery and payment</h2>
              <p class="small mb-0">{{ delivery?.label }}<br>{{ paymentText }}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="col-lg-4">
        <div class="card card-body"><TotalsList :totals="order.totals" /></div>
      </div>
    </div>
  </template>
</template>
