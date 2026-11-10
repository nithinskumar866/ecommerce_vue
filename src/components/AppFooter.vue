<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { categories } from '@/data/products';
import { asset } from '@/utils/asset';
import { coupons } from '@/utils/pricing';

// The browser only offers installation when it fires this event.
const installPrompt = ref(null);
const capture = (event) => {
  event.preventDefault();
  installPrompt.value = event;
};
onMounted(() => window.addEventListener('beforeinstallprompt', capture));
onBeforeUnmount(() => window.removeEventListener('beforeinstallprompt', capture));

async function install() {
  installPrompt.value.prompt();
  await installPrompt.value.userChoice;
  installPrompt.value = null;
}
</script>

<template>
  <footer class="no-print border-top mt-5 py-5">
    <div class="container">
      <div class="row g-4">
        <div class="col-md-4">
          <h2 class="h5"><i class="bi bi-lightning-charge-fill text-primary" aria-hidden="true"></i> Vue E-Commerce</h2>
          <p class="small text-body-secondary">
            A portfolio demo. Products, reviews, accounts, sales and orders are simulated and stay in this browser.
          </p>
          <button v-if="installPrompt" type="button" class="btn btn-outline-primary btn-sm" @click="install">
            <i class="bi bi-download me-1" aria-hidden="true"></i>Install app
          </button>
          <p class="small mb-0"><a :href="asset('images/products/CREDITS.md')">Photo credits</a></p>
        </div>
        <div class="col-6 col-md-2">
          <h2 class="h6">Shop</h2>
          <ul class="list-unstyled small mb-0">
            <li v-for="category in categories" :key="category.id" class="mb-1">
              <router-link :to="{ path: '/products', query: { category: category.id } }">{{ category.label }}</router-link>
            </li>
          </ul>
        </div>
        <div class="col-6 col-md-2">
          <h2 class="h6">Explore</h2>
          <ul class="list-unstyled small mb-0">
            <li class="mb-1"><router-link to="/deals">Deals and bundles</router-link></li>
            <li class="mb-1"><router-link to="/finder">Find my product</router-link></li>
            <li class="mb-1"><router-link to="/compare">Compare</router-link></li>
            <li class="mb-1"><router-link to="/admin">Dashboard</router-link></li>
          </ul>
        </div>
        <div class="col-md-4">
          <h2 class="h6">Try these coupons</h2>
          <ul class="list-unstyled small mb-0">
            <li v-for="coupon in coupons" :key="coupon.code" class="mb-1"><code>{{ coupon.code }}</code> {{ coupon.label }}</li>
          </ul>
        </div>
      </div>
    </div>
  </footer>
</template>
