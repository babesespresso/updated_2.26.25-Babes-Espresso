import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/Users/reinomediadigitalservices/Downloads/babes_espresso-main/client/src',
      '../../shared': path.resolve(__dirname, '../shared')
    }
  },
  server: {
    port: 3004,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
