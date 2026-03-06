import { useEffect } from "react";
import { db } from "../db/db";
import type { SearchProvider } from "../types";
import { logger } from "../utils/logger";

const DEFAULT_PROVIDERS: SearchProvider[] = [
  { id: "tmdb", enabled: true, priority: 1 },
  { id: "kinopoisk", enabled: true, priority: 2 },
  { id: "rawg", enabled: true, priority: 3 },
  { id: "google_books", enabled: true, priority: 4 },
  { id: "litres", enabled: true, priority: 5 },
];

export const useSearchProviders = () => {
  useEffect(() => {
    const initProviders = async () => {
      try {
        const existing = await db.search_providers.toArray();

        if (existing.length === 0) {
          await db.search_providers.bulkPut(DEFAULT_PROVIDERS);
        } else {
          // Add any missing providers
          const existingIds = new Set(existing.map(p => p.id));
          const missing = DEFAULT_PROVIDERS.filter(p => !existingIds.has(p.id));
          if (missing.length > 0) {
            await db.search_providers.bulkPut(missing);
          }
        }
      } catch (error) {

        logger.error("Failed to initialize search providers", "useSearchProviders", error);
      }
    };

    initProviders();
  }, []);
};
