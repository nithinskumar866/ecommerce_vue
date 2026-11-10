import { createApp } from 'vue';
import { createPinia } from 'pinia';
import Notifications from '@kyvg/vue3-notification';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@fontsource-variable/inter';
import '@fontsource-variable/space-grotesk';
import './assets/main.css';
import App from './App.vue';
import router from './router';
import { reveal } from './directives/reveal';
import { useAuthStore } from './stores/auth';

const app = createApp(App);
app.use(createPinia());
app.use(Notifications);
app.directive('reveal', reveal);

// The session must be known before the router's first guard runs.
useAuthStore().init().finally(() => {
  app.use(router);
  app.mount('#app');
});

// Only the production build is cached; caching the dev server would hide code changes.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`));
}
