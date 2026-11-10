<script setup>
import { TAX_PERCENT, formatMoney } from '@/utils/pricing';

defineProps({ totals: { type: Object, required: true } });
</script>

<template>
  <dl class="mb-0" data-testid="totals">
    <div class="d-flex justify-content-between mb-2"><dt class="fw-normal">Subtotal</dt><dd class="mb-0">{{ formatMoney(totals.subtotal) }}</dd></div>
    <div v-if="totals.bundleDiscount" class="d-flex justify-content-between mb-2 text-primary">
      <dt class="fw-normal">Bundle savings</dt><dd class="mb-0" data-testid="bundle-saving">-{{ formatMoney(totals.bundleDiscount) }}</dd>
    </div>
    <div v-if="totals.discount" class="d-flex justify-content-between mb-2 text-primary">
      <dt class="fw-normal">Discount ({{ totals.couponCode }})</dt><dd class="mb-0">-{{ formatMoney(totals.discount) }}</dd>
    </div>
    <div class="d-flex justify-content-between mb-2"><dt class="fw-normal">Delivery</dt><dd class="mb-0">{{ totals.shipping ? formatMoney(totals.shipping) : 'Free' }}</dd></div>
    <div class="d-flex justify-content-between mb-2"><dt class="fw-normal">Tax ({{ TAX_PERCENT }}%)</dt><dd class="mb-0">{{ formatMoney(totals.tax) }}</dd></div>
    <div v-if="totals.pointsValue" class="d-flex justify-content-between mb-2 text-primary">
      <dt class="fw-normal">Points ({{ totals.pointsUsed }})</dt><dd class="mb-0" data-testid="points-value">-{{ formatMoney(totals.pointsValue) }}</dd>
    </div>
    <hr>
    <div class="d-flex justify-content-between fw-bold fs-5"><dt>Total</dt><dd class="mb-0" data-testid="grand-total">{{ formatMoney(totals.total) }}</dd></div>
  </dl>
</template>
