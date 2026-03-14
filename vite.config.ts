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
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-mantine': ['@mantine/core', '@mantine/hooks', '@mantine/notifications'],
          'vendor-utils': ['axios', 'jspdf', 'xlsx', 'papaparse'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['@tabler/icons-react'],  // Не оптимизировать иконки
  },
})
