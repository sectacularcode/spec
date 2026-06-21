import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('src/template-studio')) return 'template-studio';
          if (id.includes('src/brief-to-blueprint')) return 'brief-to-blueprint';
        }
      }
    }
  }
})
