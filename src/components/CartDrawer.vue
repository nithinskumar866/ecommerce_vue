<script setup>
import { computed } from 'vue';
import QuantityStepper from './QuantityStepper.vue';
import ShopOverlay from './ShopOverlay.vue';
import { useCartStore } from '@/stores/cart';
import { useUiStore } from '@/stores/ui';
import { FREE_DELIVERY_FROM, formatMoney } from '@/utils/pricing';

const cart = useCartStore();
const ui = useUiStore();

const remaining = computed(() => Math.max(0, FREE_DELIVERY_FROM - cart.totals.subtotal));
const progress = computed(() => Math.min(100, Math.round((cart.totals.subtotal / FREE_DELIVERY_FROM) * 100)));
</script>

<template>
  <ShopOverlay :open="ui.cartOpen" label="Shopping cart" variant="drawer" @close="ui.cartOpen = false">
    <div class="d-flex justify-content-between align-items-center p-3 border-bottom">
      <h2 class="h5 mb-0">Your cart <span class="text-body-secondary fw-normal">({{ cart.count }})</span></h2>
      <button type="button" class="btn btn-outline-secondary icon-btn" aria-label="Close cart" @click="ui.cartOpen = false">
        <i class="bi bi-x-lg" aria-hidden="true"></i>
      </button>
    </div>

    <div v-if="!cart.items.length" class="text-center p-5 my-auto">
      <i class="bi bi-bag fs-1 text-body-secondary" aria-hidden="true"></i>
      <p class="mt-3 text-body-secondary">Your cart is empty.</p>
      <router-link to="/products" class="btn btn-primary">Start shopping</router-link>
    </div>

    <template v-else>
      <div class="p-3 border-bottom">
        <p class="small mb-2" data-testid="free-delivery-note">
          <template v-if="remaining">Add <strong>{{ formatMoney(remaining) }}</strong> more for free delivery</template>
          <template v-else><i class="bi bi-check-circle-fill text-primary me-1" aria-hidden="true"></i>You've unlocked free delivery</template>
        </p>
        <div class="delivery-meter" aria-hidden="true"><span :style="{ width: `${progress}%` }"></span></div>
      </div>

      <div class="flex-grow-1 overflow-auto p-3">
        <article v-for="item in cart.items" :key="item.key" class="d-flex gap-3 mb-3" data-testid="drawer-item">
          <img :src="item.variant.image" :alt="item.product.name" class="drawer-thumb">
          <div class="flex-grow-1 min-w-0">
            <div class="d-flex justify-content-between gap-2">
              <router-link :to="`/product/${item.product.id}`" class="text-body text-decoration-none fw-semibold small">{{ item.product.name }}</router-link>
              <button type="button" class="btn btn-link text-body-secondary p-0" :aria-label="`Remove ${item.product.name} from cart`" @click="cart.remove(item.key)">
                <i class="bi bi-x-lg small" aria-hidden="true"></i>
              </button>
            </div>
            <p v-if="item.variant.label" class="small text-body-secondary mb-1">{{ item.variant.label }}</p>
            <div class="d-flex justify-content-between align-items-center mt-1">
              <QuantityStepper
                :model-value="item.quantity"
                :label="item.product.name"
                :min="0"
                :max="item.quantity + Math.max(0, item.product.stock - cart.quantityOf(item.product.id))"
                @update:model-value="cart.setQuantity(item.key, $event)"
              />
              <strong class="small">{{ formatMoney(item.variant.price * item.quantity) }}</strong>
            </div>
          </div>
        </article>
      </div>

      <div class="p-3 border-top">
        <div v-if="cart.totals.bundleDiscount" class="d-flex justify-content-between small text-primary mb-1">
          <span>Bundle savings</span><span>-{{ formatMoney(cart.totals.bundleDiscount) }}</span>
        </div>
        <div class="d-flex justify-content-between fw-bold mb-3">
          <span>Subtotal</span><span>{{ formatMoney(cart.totals.subtotal - cart.totals.bundleDiscount) }}</span>
        </div>
        <router-link v-if="!cart.hasStockIssue" to="/checkout" class="btn btn-primary w-100 mb-2">Checkout</router-link>
        <router-link to="/cart" class="btn btn-outline-secondary w-100">View full cart</router-link>
      </div>
    </template>
  </ShopOverlay>
</template>

<style scoped>
.drawer-thumb {
  flex: none;
  width: 4.5rem;
  height: 4.5rem;
  object-fit: cover;
  border-radius: 0.75rem;
}

.delivery-meter {
  height: 6px;
  border-radius: 999px;
  background: var(--surface-2);
  overflow: hidden;
}

.delivery-meter span {
  display: block;
  height: 100%;
  background: var(--accent);
  border-radius: 999px;
  transition: width 0.45s var(--ease);
}
</style>
