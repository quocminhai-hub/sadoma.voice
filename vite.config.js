import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/unmixr-api': {
        target: 'https://unmixr.com/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/unmixr-api/, '')
      },
      '/minimax-api': {
        target: 'https://api.minimax.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/minimax-api/, '')
      }
    }
  }
})
