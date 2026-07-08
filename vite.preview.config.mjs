import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Standalone config used ONLY to preview the renderer UI in a browser
// (no Electron). window.api is absent here, so data won't load — but the
// shell, toolbar, grid header, and manually-added rows render for layout checks.
export default defineConfig({
  root: 'src/renderer',
  plugins: [vue()],
  server: { port: 5199, strictPort: true }
})
