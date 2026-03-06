import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@components": fileURLToPath(
        new URL("./src/components", import.meta.url),
      ),
      "@utils": fileURLToPath(new URL("./src/utils", import.meta.url)),
      "@hooks": fileURLToPath(new URL("./src/hooks", import.meta.url)),
      "@pages": fileURLToPath(new URL("./src/pages", import.meta.url)),
      "@db": fileURLToPath(new URL("./src/db", import.meta.url)),
      "@services": fileURLToPath(new URL("./src/services", import.meta.url)),
      "@context": fileURLToPath(new URL("./src/context", import.meta.url)),
      "@types": fileURLToPath(new URL("./src/types/index.ts", import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ["api"],
  },
  server: {
    proxy: {
      // Proxy for old tmdb-image URLs (used before wsrv.nl migration)
      "/api/tmdb-image": {
        target: "https://image.tmdb.org/t/p",
        changeOrigin: true,
        rewrite: (path) => {
          const url = new URL(path, "http://localhost:5173");
          const imagepath = url.searchParams.get("path");
          return imagepath || path;
        },
      },
      // Proxy for LitRes API (CORS bypass)
      "/api/litres": {
        target: "https://api.litres.ru",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/litres/, "/foundation/api"),
      },
      // Proxy for RAWG API (CORS bypass)
      "/api/rawg": {
        target: "https://api.rawg.io/api",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/rawg/, ""),
      },
      // Proxy for Kinopoisk API (CORS bypass)
      "/api/kinopoisk": {
        target: "https://kinopoiskapiunofficial.tech/api",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/kinopoisk/, ""),
      },
      // Proxy for TMDB API (CORS bypass)
      "/api/tmdb": {
        target: "https://api.themoviedb.org/3",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tmdb/, ""),
      },
    },
    watch: {
      ignored: ["**/api/**"],
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      manifest: {
        name: "TrakerEvo",
        short_name: "TrakerEvo",
        description: "Universal tracker for movies, games, and books",
        theme_color: "#000000",
        background_color: "#000000",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache external images (RAWG, TMDB via wsrv.nl, Google)
            urlPattern: /^https:\/\/(media\.rawg\.io|wsrv\.nl|.*\.googleusercontent\.com)\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "external-images-cache",
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": ["framer-motion", "lucide-react", "clsx"],
          "data-vendor": [
            "@supabase/supabase-js",
            "dexie",
            "dexie-react-hooks",
            "axios",
          ],
        },
      },
    },
  },
});
