import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    css: true,
  },
  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      }
    }
  }
})
