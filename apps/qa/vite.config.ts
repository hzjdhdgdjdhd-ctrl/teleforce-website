import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { cloudflare } from '@cloudflare/vite-plugin'

export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
  resolve: {
    alias: { '@': new URL('./src', import.meta.url).pathname },
  },
  build: {
    rollupOptions: {
      output: {
        /**
         * Split the large, rarely-changing dependencies so a copy edit does
         * not invalidate them in an agent's browser cache mid-shift.
         */
        manualChunks(id: string) {
          const path = id.replace(/\\/g, '/')
          if (!path.includes('node_modules')) return
          if (/node_modules\/(framer-motion|motion-dom|motion-utils)\//.test(path))
            return 'vendor-motion'
          if (/node_modules\/@supabase\//.test(path)) return 'vendor-supabase'
          if (/node_modules\/(react|react-dom|scheduler)\//.test(path))
            return 'vendor-react'
        },
      },
    },
  },
})
