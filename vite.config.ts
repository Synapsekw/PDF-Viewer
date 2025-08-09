import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  optimizeDeps: {
    include: ['pdfjs-dist']
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ],
    },
  },
  build: {
    // Performance optimizations
    rollupOptions: {
      output: {
        // Manual chunk splitting for better loading performance
        manualChunks: (id) => {
          // PDF.js in its own chunk (largest dependency)
          if (id.includes('pdfjs-dist')) {
            return 'pdfjs';
          }
          // React and React ecosystem
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
            return 'react-vendor';
          }
          // UI libraries
          if (id.includes('@emotion') || id.includes('styled-components')) {
            return 'ui-libs';
          }
          // Charts and visualizations
          if (id.includes('recharts') || id.includes('d3-')) {
            return 'charts';
          }
          // Icons
          if (id.includes('lucide-react') || id.includes('react-icons')) {
            return 'icons';
          }
          // Analytics features
          if (id.includes('src/features/analytics')) {
            return 'analytics';
          }
          // Node modules vendor chunk for other dependencies
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // Optimize chunk file names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `assets/[name]-[hash].js`;
        },
      },
    },
    // Increase chunk size warning limit since we're optimizing
    chunkSizeWarningLimit: 600,
    // Enable source maps for production debugging (optional)
    sourcemap: false,
    // Minification options
    minify: 'terser',
  },
})