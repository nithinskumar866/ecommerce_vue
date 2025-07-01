import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    component: () => import('../components/WelcomePage.vue') // ✅ fixed
  },
  {
    path: '/products',
    component: () => import('../components/ProductPage.vue') // ✅ fixed
  },
  {
    path: '/product/:id',
    component: () => import('../components/ProductDetails.vue') // ✅ fixed
  },
  {
    path: '/cart',
    component: () => import('../components/CartPage.vue') // ✅ fixed
  },
  {
    path: '/payment',
    component: () => import('../components/PaymentPage.vue') // ✅ fixed
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;