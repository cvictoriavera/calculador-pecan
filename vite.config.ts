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
  build: {
    outDir: 'dist',
    manifest: true,
    // Opcional: Aumentamos el límite de advertencia a 1MB para que no salten alertas falsas
    // si el vendor es grande pero necesario.
    chunkSizeWarningLimit: 1000, 
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        
        // --- AQUÍ ESTÁ LA MAGIA ---
        manualChunks(id) {
            // Si el código proviene de node_modules, mételo en un chunk llamado "vendor"
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