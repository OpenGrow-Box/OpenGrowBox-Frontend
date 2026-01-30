import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
   server: {
     port: 3004,
     host: true,
     open: false,
     cors: {
       origin: true,
       credentials: true
     },
      proxy: {
        '/api': {
          target: 'http://10.1.1.11:8123',
          changeOrigin: true,
          secure: false,
          ws: true
        }
      }
   },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps for production HA build
    minify: 'esbuild',
    target: 'es2015',
    cssCodeSplit: false, // Inline CSS into JS for single bundle
    chunkSizeWarningLimit: 5000, // Increase limit for single bundle
    rollupOptions: {
      output: {
        // Single bundle - no code splitting
        inlineDynamicImports: true,
        // Use IIFE format for better Home Assistant compatibility
        format: 'iife',
        // CRITICAL: Doubled static/static/ path required by Home Assistant
        entryFileNames: 'static/js/main.js',
        assetFileNames: 'static/[ext]/[name].[ext]'
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/Components': path.resolve(__dirname, './src/Components'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/services': path.resolve(__dirname, './services'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/utils': path.resolve(__dirname, './src/utils')
    }
  }
})