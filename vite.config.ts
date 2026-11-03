import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // Served from https://blai30.github.io/print-labels/
  base: '/print-labels/',
  plugins: [react(), tailwindcss()],
  server: {
    // Exported PDFs and Affinity saves shouldn't trigger reloads
    watch: { ignored: ['**/exports/**', '**/label-templates/**'] },
  },
  build: {
    // One HTML page per route, since GitHub Pages has no SPA fallback
    rolldownOptions: {
      input: ['index.html', 'icon/index.html'],
    },
  },
})
