<script setup>
import { computed, ref } from 'vue';
import RatingStars from './RatingStars.vue';
import { useShopActions } from '@/composables/useShopActions';
import { useCompareStore, useWishlistStore } from '@/stores/preferences';
import { useUiStore } from '@/stores/ui';
import { discountPercent } from '@/utils/catalog';
import { formatMoney } from '@/utils/pricing';
import { defaultSelection, hasOptions } from '@/utils/variants';

const props = defineProps({ product: { type: Object, required: true } });

const wishlist = useWishlistStore();
const compare = useCompareStore();
const ui = useUiStore();
const { addToCart, toggleWishlist, toggleCompare } = useShopActions();

const imageEl = ref(null);
const discount = computed(() => discountPercent(props.product));
const wished = computed(() => wishlist.has(props.product.id));
const comparing = computed(() => compare.has(props.product.id));

function primaryAction() {
  if (hasOptions(props.product)) ui.quickViewId = props.product.id;
  else addToCart(props.product, 1, defaultSelection(props.product), imageEl.value);
}
</script>

<template>
  <article class="card h-100 product-card" data-testid="product-card">
    <div class="badge-stack">
      <span v-if="product.flashEndsAt" class="badge badge-flash"><i class="bi bi-lightning-charge-fill" aria-hidden="true"></i> Flash</span>
      <span v-if="discount" class="badge badge-sale">{{ discount }}% off</span>
    </div>

    <div class="product-card__tools">
      <button
        type="button"
        class="btn btn-light icon-btn rounded-circle"
        :aria-label="wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`"
        :aria-pressed="wished"
        @click="toggleWishlist(product)"
      >
        <i class="bi" :class="wished ? 'bi-heart-fill text-danger' : 'bi-heart'" aria-hidden="true"></i>
      </button>
      <button type="button" class="btn btn-light icon-btn rounded-circle product-card__tool-reveal" :aria-label="`Quick view ${product.name}`" @click="ui.quickViewId = product.id">
        <i class="bi bi-eye" aria-hidden="true"></i>
      </button>
      <button
        type="button"
        class="btn btn-light icon-btn rounded-circle product-card__tool-reveal"
        :aria-label="comparing ? `Remove ${product.name} from comparison` : `Compare ${product.name}`"
        :aria-pressed="comparing"
        @click="toggleCompare(product)"
      >
        <i class="bi" :class="comparing ? 'bi-check-lg' : 'bi-arrow-left-right'" aria-hidden="true"></i>
      </button>
    </div>

    <router-link :to="`/product/${product.id}`" class="product-card__media" tabindex="-1" aria-hidden="true">
      <img ref="imageEl" :src="product.images[0]" alt="" class="product-image" loading="lazy">
      <img v-if="product.images[1]" :src="product.images[1]" alt="" class="product-image product-card__alt" loading="lazy">
    </router-link>

    <div class="card-body d-flex flex-column">
      <p class="small text-body-secondary mb-1">{{ product.brand }}</p>
      <h3 class="h6 card-title">
        <router-link :to="`/product/${product.id}`" class="text-body text-decoration-none">{{ product.name }}</router-link>
      </h3>
      <RatingStars :rating="product.rating" :count="product.reviewCount" />
      <p class="mt-2 mb-3">
        <span class="fw-bold">{{ formatMoney(product.price) }}</span>
        <s v-if="discount" class="small text-body-secondary ms-2">{{ formatMoney(product.mrp) }}</s>
      </p>
      <button type="button" class="btn btn-primary btn-sm mt-auto" :disabled="product.stock === 0" @click="primaryAction">
        {{ product.stock === 0 ? 'Out of stock' : hasOptions(product) ? 'Choose options' : 'Add to cart' }}
      </button>
    </div>
  </article>
</template>
