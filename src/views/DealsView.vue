<script setup>
import { computed } from 'vue';
import BundleOffer from '@/components/BundleOffer.vue';
import CatalogGate from '@/components/CatalogGate.vue';
import CountdownTimer from '@/components/CountdownTimer.vue';
import ProductGrid from '@/components/ProductGrid.vue';
import { useCatalogStore } from '@/stores/catalog';
import { BUNDLE_PERCENT, FLASH_PERCENT, bundles } from '@/utils/deals';
import { coupons } from '@/utils/pricing';

const catalog = useCatalogStore();
const flashEnd = computed(() => catalog.flashDeals[0]?.flashEndsAt ?? null);
</script>

<template>
  <CatalogGate>
    <section class="deals-hero">
      <div>
        <p class="eyebrow">Flash sale</p>
        <h1 class="mb-2">{{ FLASH_PERCENT }}% off, while the clock runs.</h1>
        <p class="text-body-secondary mb-0">A new set of products goes on sale every six hours.</p>
      </div>
      <CountdownTimer v-if="flashEnd" :ends-at="flashEnd" class="fs-3" />
    </section>

    <ProductGrid :products="catalog.flashDeals" />

    <section class="mt-5" aria-labelledby="bundle-heading">
      <div class="section-head">
        <div>
          <h2 id="bundle-heading">Bundles</h2>
          <p class="text-body-secondary mb-0">Buy both and {{ BUNDLE_PERCENT }}% comes off automatically at checkout.</p>
        </div>
      </div>
      <div class="row g-3">
        <div v-for="bundle in bundles" :key="bundle.id" class="col-md-6 col-lg-4 d-flex"><BundleOffer :bundle="bundle" class="w-100" /></div>
      </div>
    </section>

    <section class="mt-5" aria-labelledby="coupon-heading">
      <h2 id="coupon-heading" class="h4 mb-3">Coupon codes</h2>
      <div class="row g-3">
        <div v-for="coupon in coupons" :key="coupon.code" class="col-md-4">
          <div class="card card-body h-100">
            <code class="fs-5">{{ coupon.code }}</code>
            <span class="small text-body-secondary mt-1">{{ coupon.label }}</span>
          </div>
        </div>
      </div>
    </section>
  </CatalogGate>
</template>

<style scoped>
.deals-hero {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding: clamp(1.5rem, 5vw, 3.5rem);
  border: 1px solid var(--line);
  border-radius: 2rem;
  background: radial-gradient(40rem 20rem at 90% 0, rgba(200, 245, 66, 0.16), transparent 70%), var(--surface-1);
}

.deals-hero h1 {
  font-size: clamp(2rem, 5vw, 3.5rem);
}
</style>
