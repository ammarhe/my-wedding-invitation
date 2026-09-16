import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In development the API server runs on :4000; Vite proxies /api and /uploads to it.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
      '/uploads': 'http://localhost:4000',
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
