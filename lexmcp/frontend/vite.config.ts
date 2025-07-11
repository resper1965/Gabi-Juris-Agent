import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react'],
          state: ['zustand']
        }
      }
    }
  },
  define: {
    __APP_NAME__: JSON.stringify('Gabi'),
    __APP_VERSION__: JSON.stringify('1.0.0')
  }
}) 