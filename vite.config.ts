import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Слушать все интерфейсы (IPv4 + IPv6)
    port: 5173,
    hmr: {
      overlay: true,  // Показывать ошибки в браузере
    },
    watch: {
      usePolling: false,  // Отключить polling (быстрее)
      interval: 100,  // Интервал polling
    },
    cors: true,  // Разрешить CORS
  },
  build: {
    chunkSizeWarningLimit: 650,  // Лимит warning (KB)
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react'
            }
            if (id.includes('mantine')) {
              return 'vendor-mantine'
            }
            if (id.includes('axios') || id.includes('xlsx') || id.includes('papaparse')) {
              return 'vendor-utils'
            }
          }
          return undefined
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['@tabler/icons-react'],  // Не оптимизировать иконки
  },
  // Vite 8: встроенная поддержка tsconfig paths (опционально)
  resolve: {
    tsconfigPaths: false,  // Включить, если используются алиасы из tsconfig
  },
})
