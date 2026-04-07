// Vitest configuration — separate from vite.config so the PWA plugin
// doesn't run during tests.
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: false,
  },
})
