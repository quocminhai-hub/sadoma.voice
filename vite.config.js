import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/proxy': {
        target: 'https://unmixr.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/proxy/, '/api')
      },
      '/api/minimax': {
        target: 'https://api.minimax.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/minimax/, '')
      }
    }
  }
})
