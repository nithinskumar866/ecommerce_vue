<script setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import SearchBox from './SearchBox.vue';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';
import { useThemeStore, useWishlistStore } from '@/stores/preferences';
import { useUiStore } from '@/stores/ui';

const route = useRoute();
const auth = useAuthStore();
const cart = useCartStore();
const wishlist = useWishlistStore();
const theme = useThemeStore();
const ui = useUiStore();

const menuOpen = ref(false);
const pulsing = ref(false);

watch(() => route.fullPath, () => { menuOpen.value = false; });

// Waits for the fly-to-cart image to arrive before pulsing the badge.
watch(() => ui.cartPulse, () => {
  setTimeout(() => {
    pulsing.value = true;
    setTimeout(() => { pulsing.value = false; }, 500);
  }, 550);
});
</script>

<template>
  <header class="site-header no-print">
    <div class="demo-strip text-center">Demo store: no real orders or payments. Please don't enter real card details.</div>
    <nav class="navbar navbar-expand-lg" aria-label="Main">
      <div class="container gap-2">
        <router-link to="/" class="navbar-brand display-font fw-bold">
          <i class="bi bi-lightning-charge-fill brand-bolt" aria-hidden="true"></i> Vue E-Commerce
        </router-link>

        <div class="d-flex align-items-center gap-1 order-lg-last">
          <button
            type="button"
            class="nav-action cart-action"
            data-cart-target
            :aria-label="`Open cart, ${cart.count} item${cart.count === 1 ? '' : 's'}`"
            @click="ui.cartOpen = true"
          >
            <i class="bi bi-bag" aria-hidden="true"></i>
            <span v-if="cart.count" class="count-badge" :class="{ pulse: pulsing }" data-testid="cart-count">{{ cart.count }}</span>
          </button>
          <button
            class="navbar-toggler border-0"
            type="button"
            :aria-expanded="menuOpen"
            aria-controls="main-menu"
            aria-label="Toggle navigation"
            @click="menuOpen = !menuOpen"
          >
            <i class="bi fs-4" :class="menuOpen ? 'bi-x-lg' : 'bi-list'" aria-hidden="true"></i>
          </button>
        </div>

        <div id="main-menu" class="collapse navbar-collapse" :class="{ show: menuOpen }">
          <div class="navbar-nav">
            <router-link to="/products" class="nav-link">Shop</router-link>
            <router-link to="/deals" class="nav-link">Deals</router-link>
            <router-link to="/finder" class="nav-link">Finder</router-link>
          </div>
          <div class="d-flex flex-grow-1 mx-lg-4 my-2 my-lg-0"><SearchBox /></div>
          <div class="navbar-nav align-items-lg-center">
            <router-link to="/wishlist" class="nav-link">
              <i class="bi bi-heart me-1" aria-hidden="true"></i><span class="d-lg-none">Wishlist </span>
              <span class="visually-hidden">Wishlist</span>
              <span v-if="wishlist.count" class="count-badge count-badge--inline" data-testid="wishlist-count">{{ wishlist.count }}</span>
            </router-link>
            <router-link :to="auth.isSignedIn ? '/account' : '/login'" class="nav-link text-nowrap">
              <i class="bi bi-person me-1" aria-hidden="true"></i>{{ auth.isSignedIn ? auth.user.name.split(' ')[0] : 'Sign in' }}
            </router-link>
            <button
              type="button"
              class="btn btn-link nav-link text-start px-2"
              :aria-label="theme.mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'"
              @click="theme.toggle()"
            >
              <i class="bi" :class="theme.mode === 'dark' ? 'bi-sun' : 'bi-moon-stars'" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </div>
    </nav>
  </header>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 1030;
  background: var(--glass);
  backdrop-filter: blur(16px) saturate(1.4);
  border-bottom: 1px solid var(--line);
}

.demo-strip {
  padding: 0.2rem 0.75rem;
  font-size: 0.72rem;
  color: var(--ink-soft);
  border-bottom: 1px solid var(--line);
}

.navbar-brand,
.navbar-toggler,
.nav-link {
  color: var(--ink);
}

.navbar-brand:hover,
.nav-link:hover {
  color: var(--accent-text);
}

.brand-bolt {
  color: var(--accent-text);
}

.router-link-active.nav-link {
  color: var(--accent-text);
}

.nav-action {
  position: relative;
  display: grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--ink);
  font-size: 1.2rem;
}

.nav-action:hover {
  background: var(--surface-2);
}

.count-badge {
  position: absolute;
  top: 0.15rem;
  right: 0.1rem;
  min-width: 1.15rem;
  padding: 0 0.3rem;
  border-radius: 999px;
  background: var(--accent);
  color: var(--accent-ink);
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1.15rem;
  text-align: center;
}

.count-badge--inline {
  position: static;
  display: inline-block;
  margin-left: 0.15rem;
}
</style>
