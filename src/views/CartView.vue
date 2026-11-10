<script setup>
import { ref } from 'vue';
import CatalogGate from '@/components/CatalogGate.vue';
import EmptyState from '@/components/EmptyState.vue';
import QuantityStepper from '@/components/QuantityStepper.vue';
import TotalsList from '@/components/TotalsList.vue';
import { useCartStore } from '@/stores/cart';
import { formatMoney } from '@/utils/pricing';

const cart = useCartStore();
const code = ref('');
const couponError = ref('');

function applyCoupon() {
  couponError.value = cart.applyCoupon(code.value) ?? '';
  if (!couponError.value) code.value = '';
}
</script>

<template>
  <CatalogGate>
    <h1 class="h2 mb-4">Your cart</h1>
    <EmptyState v-if="!cart.items.length" icon="bi-bag" title="Your cart is empty" message="Find something you'll love.">
      <router-link to="/products" class="btn btn-primary">Continue shopping</router-link>
    </EmptyState>

    <div v-else class="row g-4">
      <div class="col-lg-8">
        <article v-for="item in cart.items" :key="item.key" class="card card-body mb-3" data-testid="cart-item">
          <div class="row align-items-center g-3">
            <div class="col-3 col-md-2">
              <img :src="item.variant.image" :alt="item.product.name" class="product-image rounded-3">
            </div>
            <div class="col-9 col-md-4">
              <h2 class="h6 mb-1"><router-link :to="`/product/${item.product.id}`" class="text-body text-decoration-none">{{ item.product.name }}</router-link></h2>
              <p v-if="item.variant.label" class="small text-body-secondary mb-0">{{ item.variant.label }}</p>
              <p class="small text-body-secondary mb-0">{{ formatMoney(item.variant.price) }} each</p>
              <p v-if="cart.isOverStock(item.product.id)" class="small text-danger mb-0" data-testid="stock-warning">
                {{ item.product.stock === 0 ? 'Now out of stock. Remove it to continue.' : `Only ${item.product.stock} left. Reduce the quantity to continue.` }}
              </p>
            </div>
            <div class="col-6 col-md-3">
              <QuantityStepper
                :model-value="item.quantity"
                :label="item.product.name"
                :min="0"
                :max="item.quantity + Math.max(0, item.product.stock - cart.quantityOf(item.product.id))"
                @update:model-value="cart.setQuantity(item.key, $event)"
              />
            </div>
            <div class="col-4 col-md-2 text-end fw-bold">{{ formatMoney(item.variant.price * item.quantity) }}</div>
            <div class="col-2 col-md-1 text-end">
              <button type="button" class="btn btn-link text-danger p-0" :aria-label="`Remove ${item.product.name} from cart`" @click="cart.remove(item.key)">
                <i class="bi bi-trash" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </article>
      </div>

      <div class="col-lg-4">
        <div class="card card-body sticky-summary">
          <h2 class="h5 mb-3">Order summary</h2>
          <TotalsList :totals="cart.totals" />

          <form class="mt-3" novalidate @submit.prevent="applyCoupon">
            <label for="coupon" class="form-label small fw-semibold">Coupon code</label>
            <div class="input-group has-validation">
              <input id="coupon" v-model="code" class="form-control" :class="{ 'is-invalid': couponError }" placeholder="WELCOME10">
              <button type="submit" class="btn btn-outline-secondary" :disabled="!code.trim()">Apply</button>
              <div v-if="couponError" class="invalid-feedback" data-testid="coupon-error">{{ couponError }}</div>
            </div>
          </form>
          <p v-if="cart.coupon && !cart.couponNotice" class="small text-primary mt-2 mb-0">
            {{ cart.coupon.code }} applied: {{ cart.coupon.label }}.
            <button type="button" class="btn btn-link btn-sm p-0" @click="cart.removeCoupon()">Remove</button>
          </p>
          <p v-if="cart.couponNotice" class="small text-danger mt-2 mb-0">{{ cart.couponNotice }}</p>

          <router-link v-if="!cart.hasStockIssue" to="/checkout" class="btn btn-primary w-100 mt-3">Proceed to checkout</router-link>
          <button v-else type="button" class="btn btn-primary w-100 mt-3" disabled>Fix stock issues to continue</button>
        </div>
      </div>
    </div>
  </CatalogGate>
</template>

<style scoped>
.sticky-summary {
  position: sticky;
  top: 6.5rem;
}
</style>
