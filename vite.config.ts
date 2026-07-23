import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
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
        // Print feature default back is high-DPI (~6MB); exclude from precache (loaded on demand).
        globIgnores: ['**/features/print/**'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
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
