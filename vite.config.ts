import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Deployed to GitHub Pages at https://justinebert.github.io/Woodshed/ — the
// repo-name base path is required so all asset URLs resolve correctly
// under the project-pages subdirectory. Manifest icon `src` values use
// relative paths so the browser resolves them against the manifest's
// own URL; this keeps the config working if we ever move to a root-
// served custom domain without needing a code change.
export default defineConfig({
  base: '/Woodshed/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Woodshed',
        short_name: 'Woodshed',
        description: 'AI-powered personal practice trainer for musicians',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
