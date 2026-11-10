import { copyFileSync, readdirSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

// GitHub Pages serves this project from /<repository-name>/.
const PAGES_BASE = '/ecommerce_vue/';

const publicFiles = (folder) => readdirSync(new URL(`./public/${folder}`, import.meta.url), { withFileTypes: true })
  .filter((entry) => entry.isFile() && !entry.name.endsWith('.md'))
  .map((entry) => `${folder}/${entry.name}`);

// Lists every built file so the service worker can make the whole store available offline.
function precacheManifest() {
  return {
    name: 'precache-manifest',
    apply: 'build',
    generateBundle(_, bundle) {
      const built = Object.keys(bundle).filter((file) => !file.endsWith('.html'));
      this.emitFile({
        type: 'asset',
        fileName: 'precache-manifest.json',
        source: JSON.stringify([...built, ...publicFiles('images'), ...publicFiles('images/products'), ...publicFiles('icons')]),
      });
    },
  };
}

// GitHub Pages has no rewrite rules, so its 404 page has to boot the app for deep links.
function spaFallback() {
  return {
    name: 'spa-fallback',
    apply: 'build',
    closeBundle() {
      copyFileSync(new URL('./dist/index.html', import.meta.url), new URL('./dist/404.html', import.meta.url));
    },
  };
}

export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? PAGES_BASE : '/',
  plugins: [vue(), precacheManifest(), spaFallback()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // Port 8080 is commonly taken by local web servers such as Apache.
  server: { port: 8081 },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.spec.js'],
  },
}));
