import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        id: '/',
        name: 'Sparkle Finance',
        short_name: 'Sparkle Finance',
        description: 'Gestão financeira pessoal offline-first',
        theme_color: '#0b0b0e',
        background_color: '#0b0b0e',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        lang: 'pt-BR',
        icons: [
          { src: '/icons/sparkle-mark-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/sparkle-mark-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/sparkle-mark-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        navigateFallback: '/index.html',
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg}'],
        globIgnores: [
          'impeccable-preview.html',
          'icons/apple-touch-icon.svg',
          'icons/sparkle-mark-192.png',
          'icons/sparkle-mark-512.png',
          'icons/sparkle-mark-maskable-512.png',
          'icons/sparkle-mark.svg',
          'icons/sparkle-mark-192.svg',
          'icons/sparkle-mark-512.svg',
          'icons/sparkle-mark-maskable-512.svg'
        ]
      }
    })
  ]
})
