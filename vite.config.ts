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
        // On-demand art stays out of the install precache and is cached after first use.
        globIgnores: [
          '**/features/print/**',
          '**/assets/print/**',
          '**/card-parts/outer-border-texture/**',
          '**/armor/**',
          '**/land-panels/**',
          '**/spell-panels/**',
          '**/premodern-rules-textbox/**',
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
                url.pathname.startsWith('/premodern-rules-textbox/')),
            handler: 'CacheFirst',
            options: {
              cacheName: 'umps-ondemand-art',
              expiration: { maxEntries: 180, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            // Module 5.5 — static icon/watermark/texture assets only.
            // Keep cache scope tight to avoid remote/user image caching side effects.
            urlPattern: ({ request, url }) =>
              request.destination === 'image' &&
              (/^\/watermarks\//.test(url.pathname) ||
                /^\/planeswalker-symbols\//.test(url.pathname) ||
                /^\/assets\/textures\//.test(url.pathname) ||
                /^\/pwa-(192|512)\.svg$/.test(url.pathname)),
            handler: 'CacheFirst',
            options: {
              cacheName: 'umps-static-images',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === 'font',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'umps-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 },
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
