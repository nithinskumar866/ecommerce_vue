<script setup>
import { watch } from 'vue';
import { useRoute } from 'vue-router';
import AppFooter from '@/components/AppFooter.vue';
import AppHeader from '@/components/AppHeader.vue';
import CartDrawer from '@/components/CartDrawer.vue';
import CompareTray from '@/components/CompareTray.vue';
import QuickViewModal from '@/components/QuickViewModal.vue';
import { useCatalogStore } from '@/stores/catalog';
import { useThemeStore } from '@/stores/preferences';
import { useUiStore } from '@/stores/ui';

const route = useRoute();
const ui = useUiStore();

useThemeStore();
useCatalogStore().load();

watch(() => route.fullPath, () => ui.closeAll());
</script>

<template>
  <div class="shop-layout">
    <a href="#main" class="skip-link no-print">Skip to content</a>
    <AppHeader />
    <main id="main" class="container py-4">
      <router-view v-slot="{ Component, route: viewRoute }">
        <Transition name="page" mode="out-in">
          <div :key="viewRoute.path"><component :is="Component" /></div>
        </Transition>
      </router-view>
    </main>
    <AppFooter />
    <CompareTray />
    <CartDrawer />
    <QuickViewModal />
    <notifications position="top right" class="no-print" />
  </div>
</template>
