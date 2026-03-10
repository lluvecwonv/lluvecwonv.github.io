import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split heavy deps into separate cacheable chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-markdown': ['react-markdown', 'remark-gfm'],
          'vendor-motion': ['framer-motion'],
          'vendor-supabase': ['@supabase/supabase-js'],
          // mapbox-gl is already lazy-loaded via TravelGlobe
        },
      },
    },
    // Enable source map for debugging, disable in prod if not needed
    sourcemap: false,
    // Target modern browsers for smaller output
    target: 'es2020',
  },
})
