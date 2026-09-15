import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
  resolve: {
    alias: { '@': new URL('./src', import.meta.url).pathname },
  },
  build: {
    rollupOptions: {
      output: {
        /**
         * Split the two large, rarely-changing dependency groups into their
         * own chunks so a content edit does not invalidate the whole bundle
         * in visitors' browser caches.
         */
        /* Rollup in Vite 8 takes the function form only. */
        manualChunks(id: string) {
          const path = id.replace(/\\/g, '/')
          if (!path.includes('node_modules')) return
          if (/node_modules\/(framer-motion|motion-dom|motion-utils)\//.test(path))
            return 'vendor-motion'
          if (
            /node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(
              path,
            )
          )
            return 'vendor-react'
        },
      },
    },
  },
})