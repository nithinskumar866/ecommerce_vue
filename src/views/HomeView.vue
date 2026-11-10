<script setup>
import { computed } from 'vue';
import BundleOffer from '@/components/BundleOffer.vue';
import CatalogGate from '@/components/CatalogGate.vue';
import CountdownTimer from '@/components/CountdownTimer.vue';
import ProductCard from '@/components/ProductCard.vue';
import ProductGrid from '@/components/ProductGrid.vue';
import { categories } from '@/data/products';
import { useCatalogStore } from '@/stores/catalog';
import { useRecentlyViewedStore } from '@/stores/preferences';
import { asset } from '@/utils/asset';
import { bundles } from '@/utils/deals';
import { formatMoney } from '@/utils/pricing';

const SPOTLIGHT_ID = 12;

const catalog = useCatalogStore();
const recent = useRecentlyViewedStore();

const flashEnd = computed(() => catalog.flashDeals[0]?.flashEndsAt ?? null);
const topRated = computed(() => [...catalog.products]
  .filter((product) => product.stock > 0)
  .sort((a, b) => b.rating - a.rating)
  .slice(0, 8));
const recentlyViewed = computed(() => recent.ids.flatMap((id) => catalog.byId.get(id) ?? []));
const spotlight = computed(() => catalog.byId.get(SPOTLIGHT_ID));

const perks = ['Free delivery above ₹999', 'New flash deals every 6 hours', 'Earn points on every order', 'Bundle and save 5%', 'Cash on Delivery available'];
</script>

<template>
  <section class="hero full-bleed">
    <div class="container hero__inner">
      <div class="hero__copy">
        <p class="eyebrow">New season tech</p>
        <h1 class="hero__title">Gear that keeps up with you.</h1>
        <p class="hero__lead">Phones, audio, smart home and more, picked for people who care about the details.</p>
        <div class="d-flex flex-wrap gap-2">
          <router-link to="/products" class="btn btn-primary btn-lg">Shop now</router-link>
          <router-link to="/finder" class="btn btn-outline-secondary btn-lg"><i class="bi bi-stars me-1" aria-hidden="true"></i>Find my match</router-link>
        </div>
      </div>
      <div class="hero__art" aria-hidden="true">
        <div class="hero__glow"></div>
        <img :src="asset('images/products/keyboard.webp')" alt="" class="hero__image hero__image--main">
        <img :src="asset('images/products/headphones-black.webp')" alt="" class="hero__image hero__image--float-a">
        <img :src="asset('images/products/bulb.webp')" alt="" class="hero__image hero__image--float-b">
      </div>
    </div>
  </section>

  <div class="marquee full-bleed" aria-hidden="true">
    <div class="marquee__track">
      <template v-for="round in 4" :key="round">
        <span v-for="perk in perks" :key="`${round}-${perk}`"><i class="bi bi-lightning-charge-fill" aria-hidden="true"></i>{{ perk }}</span>
      </template>
    </div>
  </div>

  <CatalogGate>
    <section v-if="catalog.flashDeals.length" v-reveal class="my-5" aria-labelledby="flash-heading">
      <div class="section-head">
        <div>
          <p class="eyebrow mb-1">Limited time</p>
          <h2 id="flash-heading">Flash deals, 15% off</h2>
        </div>
        <div class="d-flex align-items-center gap-3">
          <CountdownTimer :ends-at="flashEnd" />
          <router-link to="/deals" class="btn btn-outline-secondary btn-sm">All deals</router-link>
        </div>
      </div>
      <ProductGrid :products="catalog.flashDeals" />
    </section>

    <section v-reveal class="my-5" aria-labelledby="categories-heading">
      <div class="section-head"><h2 id="categories-heading">Shop by category</h2></div>
      <div class="bento">
        <router-link
          v-for="(category, index) in categories"
          :key="category.id"
          :to="{ path: '/products', query: { category: category.id } }"
          class="bento__tile"
          :class="`bento__tile--${index}`"
        >
          <img :src="category.image" alt="" loading="lazy">
          <span class="bento__label">{{ category.label }}<i class="bi bi-arrow-up-right" aria-hidden="true"></i></span>
        </router-link>
      </div>
    </section>

    <section v-if="spotlight" v-reveal class="spotlight my-5" aria-labelledby="spotlight-heading">
      <img :src="spotlight.images[1]" alt="" class="spotlight__image" loading="lazy">
      <div class="spotlight__copy">
        <p class="eyebrow">Spotlight</p>
        <h2 id="spotlight-heading">{{ spotlight.name }}</h2>
        <p class="text-body-secondary">{{ spotlight.description }}</p>
        <ul class="list-unstyled mb-4">
          <li v-for="highlight in spotlight.highlights" :key="highlight" class="mb-1"><i class="bi bi-check2 text-primary me-2" aria-hidden="true"></i>{{ highlight }}</li>
        </ul>
        <router-link :to="`/product/${spotlight.id}`" class="btn btn-primary">From {{ formatMoney(spotlight.price) }}</router-link>
      </div>
    </section>

    <section v-reveal class="my-5" aria-labelledby="rated-heading">
      <div class="section-head"><h2 id="rated-heading">Top rated</h2></div>
      <div class="rail">
        <ProductCard v-for="product in topRated" :key="product.id" :product="product" />
      </div>
    </section>

    <section v-reveal class="my-5" aria-labelledby="bundles-heading">
      <div class="section-head">
        <h2 id="bundles-heading">Better together</h2>
        <router-link to="/deals" class="btn btn-outline-secondary btn-sm">All bundles</router-link>
      </div>
      <div class="row g-3">
        <div v-for="bundle in bundles.slice(0, 3)" :key="bundle.id" class="col-md-4 d-flex"><BundleOffer :bundle="bundle" class="w-100" /></div>
      </div>
    </section>

    <section v-reveal class="finder-cta my-5">
      <div>
        <p class="eyebrow">Not sure what to pick?</p>
        <h2 class="mb-2">Answer three questions, get your match.</h2>
        <p class="text-body-secondary mb-0">Our product finder narrows 24 products down to the three that suit you best.</p>
      </div>
      <router-link to="/finder" class="btn btn-primary btn-lg text-nowrap">Start the finder</router-link>
    </section>

    <section v-if="recentlyViewed.length" v-reveal class="my-5" aria-labelledby="recent-heading">
      <div class="section-head"><h2 id="recent-heading">Pick up where you left off</h2></div>
      <div class="rail">
        <ProductCard v-for="product in recentlyViewed" :key="product.id" :product="product" />
      </div>
    </section>
  </CatalogGate>
</template>

<style scoped>
.hero {
  position: relative;
  margin-top: -1.5rem;
  overflow: hidden;
  background: radial-gradient(60rem 30rem at 85% 20%, rgba(139, 92, 246, 0.2), transparent 70%);
}

.hero__inner {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  align-items: center;
  gap: 2rem;
  min-height: min(44rem, 82vh);
  padding-block: 4rem;
}

.hero__title {
  font-size: clamp(2.8rem, 7vw, 5.5rem);
  line-height: 1;
  margin-bottom: 1.25rem;
}

.hero__lead {
  max-width: 34rem;
  margin-bottom: 2rem;
  font-size: 1.15rem;
  color: var(--ink-soft);
}

.hero__art {
  position: relative;
  aspect-ratio: 1;
  max-height: 34rem;
}

.hero__glow {
  position: absolute;
  inset: 12%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(200, 245, 66, 0.35), transparent 68%);
  filter: blur(30px);
  animation: glow 6s ease-in-out infinite;
}

@keyframes glow {
  50% { transform: scale(1.12); opacity: 0.7; }
}

.hero__image {
  position: absolute;
  object-fit: cover;
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
}

.hero__image--main {
  inset: 9%;
  width: 82%;
  height: 82%;
  border-radius: 2rem;
}

.hero__image--float-a,
.hero__image--float-b {
  width: 34%;
  aspect-ratio: 1;
  border-radius: 1.25rem;
  animation: float 7s ease-in-out infinite;
}

.hero__image--float-a {
  top: 0;
  right: 0;
}

.hero__image--float-b {
  bottom: 2%;
  left: 0;
  animation-delay: -3.5s;
}

@keyframes float {
  50% { transform: translateY(-14px); }
}

.marquee {
  overflow: hidden;
  border-block: 1px solid var(--line);
  padding-block: 0.7rem;
}

.marquee__track {
  display: flex;
  gap: 3rem;
  width: max-content;
  animation: marquee 48s linear infinite;
  font-family: var(--display-font);
  font-weight: 500;
  white-space: nowrap;
}

.marquee__track i {
  margin-right: 0.6rem;
  color: var(--accent-text);
}

@keyframes marquee {
  to { transform: translateX(-50%); }
}

.bento {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 13rem;
  gap: 1rem;
}

.bento__tile {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 1.5rem;
  color: #fff;
  text-decoration: none;
}

.bento__tile img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.7s var(--ease);
}

.bento__tile:hover img {
  transform: scale(1.06);
}

.bento__tile::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.75), transparent 60%);
}

.bento__tile--0,
.bento__tile--3 {
  grid-column: span 2;
  grid-row: span 2;
}

.bento__label {
  position: absolute;
  z-index: 1;
  left: 1.1rem;
  right: 1.1rem;
  bottom: 0.9rem;
  display: flex;
  justify-content: space-between;
  font-family: var(--display-font);
  font-size: 1.15rem;
  font-weight: 600;
}

.spotlight {
  display: grid;
  grid-template-columns: 1fr 1fr;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 2rem;
  background: var(--surface-1);
}

.spotlight__image {
  width: 100%;
  height: 100%;
  min-height: 22rem;
  object-fit: cover;
}

.spotlight__copy {
  align-self: center;
  padding: clamp(1.5rem, 5vw, 4rem);
}

.spotlight__copy h2 {
  font-size: clamp(1.8rem, 4vw, 3rem);
}

.finder-cta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: clamp(1.5rem, 5vw, 3.5rem);
  border: 1px solid var(--line);
  border-radius: 2rem;
  background: radial-gradient(40rem 20rem at 90% 0, rgba(200, 245, 66, 0.14), transparent 70%), var(--surface-1);
}

@media (max-width: 767.98px) {
  .hero__inner,
  .spotlight {
    grid-template-columns: 1fr;
  }

  .hero__inner {
    padding-block: 2.5rem;
  }

  .hero__art {
    width: min(24rem, 100%);
    margin-inline: auto;
  }

  .bento {
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: 9rem;
  }

  .bento__tile--0,
  .bento__tile--3 {
    grid-row: span 1;
  }
}
</style>
