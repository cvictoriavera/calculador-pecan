import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, './src')
    },
  },
  server: {
    proxy: {
      '/wp-json': {
        target: 'http://localhost',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    manifest: true,
    // Aumentamos el límite de advertencia a 1500KB para incluir el chunk de datos geográficos
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',

        // --- AQUÍ ESTÁ LA MAGIA ---
        manualChunks(id) {
          if (id.includes('recharts') || id.includes('d3-')) {
            return 'charts';
          }
          if (id.includes('@radix-ui') || id.includes('lucide-react')) {
            return 'ui';
          }
          if (id.includes('geo-argentina.json')) {
            return 'geo-argentina';
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
        // --------------------------
      }
    }
  },

  base: './', // Para rutas relativas en WordPress
})