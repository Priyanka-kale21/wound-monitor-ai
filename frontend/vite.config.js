import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/token': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        secure: false
      },
      '/register': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        secure: false
      },
      '/analyze': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        secure: false
      },
      '/patients': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        secure: false
      },
      '/notes': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        secure: false
      },
      '/doctor': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        secure: false
      },
      '/uploads': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        secure: false
      },
      '/analysis': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
