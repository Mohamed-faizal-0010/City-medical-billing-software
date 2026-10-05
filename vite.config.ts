import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Plugin to prevent uncaught "Cannot read properties of undefined (reading 'send')"
// in sandbox / proxy dev environments where WebSocket HMR connection cannot be established
function viteClientHmrFixPlugin(): Plugin {
  return {
    name: 'vite-client-hmr-guard',
    enforce: 'pre',
    transform(code, id) {
      if (id.includes('@vite/client') || id.includes('vite/dist/client/client.mjs')) {
        return code
          .replace(
            /send\(data\)\s*\{\s*ws\.send\(JSON\.stringify\(data\)\);\s*\}/g,
            'send(data) { if (ws && typeof ws.send === "function" && ws.readyState === 1) { try { ws.send(JSON.stringify(data)); } catch (e) {} } }'
          )
          .replace(
            /ws\.send\(JSON\.stringify\(data\)\);/g,
            'if (ws && typeof ws.send === "function" && ws.readyState === 1) { try { ws.send(JSON.stringify(data)); } catch (e) {} }'
          )
          .replace(
            /send\(data\)\s*\{\s*wsTransport\.send\(data\);\s*\}/g,
            'send(data) { try { wsTransport?.send?.(data); } catch (e) {} }'
          )
          .replace(
            /wsTransport\.send\(data\);/g,
            'try { wsTransport?.send?.(data); } catch (e) {}'
          )
          .replace(
            /this\.transport\.send\(payload\)\.catch/g,
            'Promise.resolve().then(() => this.transport?.send?.(payload)).catch'
          );
      }
      return null;
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      viteClientHmrFixPlugin(),
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.png', 'apple-touch-icon.png', 'icon.svg', 'pwa-192x192.png', 'pwa-512x512.png', 'pwa-maskable-512x512.png'],
        manifest: {
          id: '/',
          name: 'City Medical - Pharmacy Management System',
          short_name: 'CityMedical',
          description: 'Cloud-based pharmacy ERP and POS system for City Medical (Melur, Madurai, Tamil Nadu).',
          theme_color: '#0f766e',
          background_color: '#0f766e',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/',
          scope: '/',
          categories: ['medical', 'business', 'productivity'],
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ],
          shortcuts: [
            {
              name: 'POS Billing & Checkout',
              short_name: 'POS Billing',
              description: 'Start quick counter sale and barcode scan',
              url: '/?tab=pos',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
            },
            {
              name: 'Batch Stock & Expiry Check',
              short_name: 'Batch Stock',
              description: 'Check available medicine quantities and nearing expiries',
              url: '/?tab=inventory',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
            },
            {
              name: 'Clinic & Doctor Consultations',
              short_name: 'Clinic OPD',
              description: 'View patient queue and convert Rx to billing',
              url: '/?tab=clinic',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
            }
          ]
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
        },
        injectRegister: 'auto',
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
