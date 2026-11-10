import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const SITE_NAME = 'Vue E-Commerce';

const routes = [
  { path: '/', component: () => import('@/views/HomeView.vue') },
  { path: '/products', component: () => import('@/views/ProductsView.vue'), meta: { title: 'Products' } },
  { path: '/product/:id(\\d+)', component: () => import('@/views/ProductDetailView.vue') },
  { path: '/deals', component: () => import('@/views/DealsView.vue'), meta: { title: 'Deals' } },
  { path: '/finder', component: () => import('@/views/FinderView.vue'), meta: { title: 'Find my product' } },
  { path: '/compare', component: () => import('@/views/CompareView.vue'), meta: { title: 'Compare' } },
  { path: '/cart', component: () => import('@/views/CartView.vue'), meta: { title: 'Cart' } },
  { path: '/wishlist', component: () => import('@/views/WishlistView.vue'), meta: { title: 'Wishlist' } },
  { path: '/checkout', component: () => import('@/views/CheckoutView.vue'), meta: { title: 'Checkout', requiresAuth: true } },
  { path: '/login', component: () => import('@/views/LoginView.vue'), meta: { title: 'Sign in', guestOnly: true } },
  { path: '/signup', component: () => import('@/views/SignupView.vue'), meta: { title: 'Create account', guestOnly: true } },
  { path: '/account', component: () => import('@/views/AccountView.vue'), meta: { title: 'My account', requiresAuth: true } },
  { path: '/orders', component: () => import('@/views/OrdersView.vue'), meta: { title: 'My orders', requiresAuth: true } },
  { path: '/orders/:id', component: () => import('@/views/OrderDetailView.vue'), meta: { title: 'Order details', requiresAuth: true } },
  { path: '/orders/:id/invoice', component: () => import('@/views/InvoiceView.vue'), meta: { title: 'Invoice', requiresAuth: true } },
  { path: '/admin', component: () => import('@/views/AdminView.vue'), meta: { title: 'Dashboard', requiresAuth: true, requiresAdmin: true } },
  { path: '/:pathMatch(.*)*', component: () => import('@/views/NotFoundView.vue'), meta: { title: 'Page not found' } },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    return to.path === from.path ? undefined : { top: 0 };
  },
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.isSignedIn) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }
  if (to.meta.requiresAdmin && !auth.user.isAdmin) return '/account';
  if (to.meta.guestOnly && auth.isSignedIn) return '/account';
  return true;
});

export function setPageTitle(title) {
  document.title = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
}

router.afterEach((to) => setPageTitle(to.meta.title));

export default router;
