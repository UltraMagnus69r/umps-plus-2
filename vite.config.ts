import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    watch: {
      ignored: ['**/.local-history/**', '**/dist/**', '**/New Assets/**'],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('/services/scryfallService') ||
            id.includes('/authority/scryfallResultsFilterAuthority') ||
            id.includes('/components/layout/ScryfallImportSection')
          ) {
            return 'scryfall'
          }
          if (
            id.includes('/components/ui/FontMenu') ||
            id.includes('/components/ui/FontFamilyPicker')
          ) {
            return 'font-picker'
          }
          if (
            id.includes('/components/layout/OuterBorderPicker') ||
            id.includes('/data/outerBorderOptions') ||
            id.includes('/components/layout/AdvancedPanelsSection')
          ) {
            return 'style-advanced'
          }
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      injectRegister: false,
      registerType: 'autoUpdate',
      manifest: {
        name: 'UltraMagnus Proxy Showcase',
        short_name: 'UltraMagnus',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        icons: [
          {
            src: '/pwa-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/pwa-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
        // Precache only the shell + critical defaults. On-demand art/fonts/print
        // are runtime-cached on first use (see runtimeCaching below).
        globIgnores: [
          '**/features/print/**',
          '**/assets/print/**',
          '**/card-parts/outer-border-texture/**',
          '**/armor/**',
          '**/land-panels/**',
          '**/spell-panels/**',
          '**/premodern-rules-textbox/**',
          '**/assets/textures/**',
          '**/mana-custom/**',
          '**/mana-alt/**',
          '**/assets/crowns/**',
          '**/crown/**',
          '**/watermarks/**',
          '**/planeswalker-symbols/**',
          // canvg (jsPDF SVG helper) — hashed as assets/index.es-*.js; not needed for editor open
          '**/index.es*',
          '**/PrintFeaturePage*',
          '**/html2canvas*',
          '**/jspdf*',
          '**/purify*',
          '**/scryfall*',
          '**/font-picker*',
          '**/style-advanced*',
        ],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: ({ request, url }) =>
              request.destination === 'image' &&
              (url.pathname.startsWith('/card-parts/outer-border-texture/') ||
                url.pathname.startsWith('/armor/') ||
                url.pathname.startsWith('/land-panels/') ||
                url.pathname.startsWith('/spell-panels/') ||
                url.pathname.startsWith('/premodern-rules-textbox/') ||
                url.pathname.startsWith('/assets/textures/') ||
                url.pathname.startsWith('/assets/crowns/') ||
                url.pathname.startsWith('/crown/') ||
                url.pathname.startsWith('/mana-custom/') ||
                url.pathname.startsWith('/mana-alt/')),
            handler: 'CacheFirst',
            options: {
              cacheName: 'umps-ondemand-art',
              expiration: { maxEntries: 220, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            // Module 5.5 — static icon/watermark assets + PWA icons.
            urlPattern: ({ request, url }) =>
              request.destination === 'image' &&
              (/^\/watermarks\//.test(url.pathname) ||
                /^\/planeswalker-symbols\//.test(url.pathname) ||
                /^\/pwa-(192|512)\.svg$/.test(url.pathname)),
            handler: 'CacheFirst',
            options: {
              cacheName: 'umps-static-images',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            // Lazy editor chunks (Scryfall / font picker / advanced Style / print).
            urlPattern: ({ request, url }) =>
              request.destination === 'script' &&
              (/scryfall|font-picker|style-advanced|PrintFeaturePage|html2canvas|jspdf|purify|index\.es/i.test(
                url.pathname,
              )),
            handler: 'CacheFirst',
            options: {
              cacheName: 'umps-lazy-chunks',
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === 'font',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'umps-fonts',
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'umps-pages',
              networkTimeoutSeconds: 3,
            },
          },
        ],
      },
    }),
  ],
})
