import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '../../shared': path.resolve(__dirname, '../shared')
    }
  },
  server: {
    port: 3007,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3012',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
