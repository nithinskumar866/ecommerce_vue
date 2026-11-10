<script setup>
import { computed, reactive, ref, watch } from 'vue';
import CountdownTimer from './CountdownTimer.vue';
import QuantityStepper from './QuantityStepper.vue';
import { useShopActions } from '@/composables/useShopActions';
import { useCartStore } from '@/stores/cart';
import { useCompareStore, useWishlistStore } from '@/stores/preferences';
import { formatMoney } from '@/utils/pricing';
import { defaultSelection, resolveVariant } from '@/utils/variants';

const props = defineProps({
  product: { type: Object, required: true },
  flySource: { type: Object, default: null },
});
const emit = defineEmits(['image', 'added']);

const cart = useCartStore();
const wishlist = useWishlistStore();
const compare = useCompareStore();
const { addToCart, toggleWishlist, toggleCompare } = useShopActions();

const selection = reactive(defaultSelection(props.product));
const quantity = ref(1);

const variant = computed(() => resolveVariant(props.product, selection));
const remaining = computed(() => props.product.stock - cart.quantityOf(props.product.id));
const discount = computed(() => (variant.value.mrp > variant.value.price
  ? Math.round(((variant.value.mrp - variant.value.price) / variant.value.mrp) * 100)
  : 0));

watch(() => props.product.id, () => {
  Object.assign(selection, defaultSelection(props.product));
  quantity.value = 1;
});

function chooseColor(option) {
  selection.color = option.id;
  emit('image', option.image);
}

function add() {
  if (addToCart(props.product, quantity.value, { ...selection }, props.flySource)) {
    quantity.value = 1;
    emit('added');
  }
}
</script>

<template>
  <div>
    <div v-if="product.flashEndsAt" class="flash-note mb-3">
      <span class="fw-semibold"><i class="bi bi-lightning-charge-fill me-1" aria-hidden="true"></i>Flash deal ends in</span>
      <CountdownTimer :ends-at="product.flashEndsAt" />
    </div>

    <p class="fs-2 fw-bold display-font mb-0" data-testid="variant-price">{{ formatMoney(variant.price) }}</p>
    <p class="small text-body-secondary mb-3">
      <template v-if="discount"><s>{{ formatMoney(variant.mrp) }}</s> · <span class="text-primary fw-semibold">{{ discount }}% off</span> · </template>plus 5% tax at checkout
    </p>

    <fieldset v-if="product.colors" class="mb-3">
      <legend class="fs-6 fw-semibold">Colour: <span class="fw-normal text-body-secondary">{{ product.colors.find((c) => c.id === selection.color)?.label }}</span></legend>
      <div class="d-flex gap-2">
        <button
          v-for="option in product.colors"
          :key="option.id"
          type="button"
          class="swatch"
          :class="{ 'is-selected': option.id === selection.color }"
          :style="{ background: option.swatch }"
          :aria-label="option.label"
          :aria-pressed="option.id === selection.color"
          @click="chooseColor(option)"
        ></button>
      </div>
    </fieldset>

    <fieldset v-if="product.storages" class="mb-3">
      <legend class="fs-6 fw-semibold">Storage</legend>
      <div class="d-flex flex-wrap gap-2">
        <button
          v-for="option in product.storages"
          :key="option.id"
          type="button"
          class="choice"
          :class="{ 'is-selected': option.id === selection.storage }"
          :aria-pressed="option.id === selection.storage"
          @click="selection.storage = option.id"
        >
          {{ option.label }}<small v-if="option.delta" class="d-block text-body-secondary">+{{ formatMoney(option.delta) }}</small>
        </button>
      </div>
    </fieldset>

    <p v-if="product.stock === 0" class="text-danger fw-semibold" data-testid="stock-status">Out of stock</p>
    <p v-else-if="product.stock <= 5" class="text-warning" data-testid="stock-status">Only {{ product.stock }} left</p>
    <p v-else class="text-success" data-testid="stock-status">In stock</p>

    <div class="d-flex flex-wrap align-items-center gap-2">
      <QuantityStepper v-if="remaining > 0" v-model="quantity" :label="product.name" :max="remaining" />
      <button type="button" class="btn btn-primary flex-grow-1" :disabled="remaining <= 0" @click="add">
        {{ product.stock === 0 ? 'Out of stock' : remaining <= 0 ? 'All available stock is in your cart' : 'Add to cart' }}
      </button>
    </div>
    <div class="d-flex gap-2 mt-2">
      <button type="button" class="btn btn-outline-secondary flex-fill" :aria-pressed="wishlist.has(product.id)" @click="toggleWishlist(product)">
        <i class="bi me-1" :class="wishlist.has(product.id) ? 'bi-heart-fill text-danger' : 'bi-heart'" aria-hidden="true"></i>Wishlist
      </button>
      <button type="button" class="btn btn-outline-secondary flex-fill" :aria-pressed="compare.has(product.id)" @click="toggleCompare(product)">
        <i class="bi bi-arrow-left-right me-1" aria-hidden="true"></i>{{ compare.has(product.id) ? 'Comparing' : 'Compare' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.flash-note {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.6rem 0.9rem;
  border: 1px solid var(--accent);
  border-radius: 0.875rem;
  background: var(--accent-soft);
}

.swatch {
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid var(--line);
  border-radius: 50%;
  outline-offset: 2px;
}

.swatch.is-selected {
  outline: 2px solid var(--accent);
}

.choice {
  min-width: 6rem;
  padding: 0.5rem 0.9rem;
  border: 1px solid var(--line);
  border-radius: 0.75rem;
  background: var(--surface-2);
  color: var(--ink);
  font-weight: 600;
}

.choice.is-selected {
  border-color: var(--accent);
  box-shadow: inset 0 0 0 1px var(--accent);
}
</style>
