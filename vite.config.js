import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          // Split Template Studio and Brief to Blueprint into separate chunks
          // so the browser only loads what's needed for the active tab
          manualChunks: {
            'template-studio': ['./src/elementor-builder.jsx'],
            'brief-to-blueprint': ['./src/CustomBuild.jsx'],
          },
        },
      },
    },
    server: {
      proxy: {
        '/api/anthropic': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/anthropic/, ''),
          headers: {
            'anthropic-version': '2023-06-01',
            'x-api-key': env.VITE_ANTHROPIC_API_KEY,
          }
        }
      }
    }
  }
})
