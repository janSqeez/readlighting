import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8'));

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',
      // Registrierung NICHT automatisch ins HTML injizieren — wir registrieren den
      // Service-Worker in main.tsx gezielt nur im echten Web. In der Capacitor-WebView
      // (Android/Electron) würde ein gecachter SW sonst das alte Bundle ausliefern und
      // erzwang früher ein Neu-Installieren (= Datenverlust).
      injectRegister: false,
      manifest: {
        name: 'Readlighting',
        short_name: 'Readlighting',
        description: 'Read and annotate documents with highlights and comments',
        theme_color: '#0070f2',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: '/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
      },
    }),
  ],
  build: {
    target: 'es2020',
  },
});
