import axios, { type AxiosInstance, type AxiosError } from "axios";
import { db } from "../db/db";
import { logger } from "../utils/logger";

// Helper to get key from DB or LocalStorage
const getStoredKey = async (
  settingsKey: string,
): Promise<string | undefined> => {
  const local = localStorage.getItem(settingsKey);
  if (local && local !== "test-key" && local.trim() !== "") return local.trim();

  try {
    const s = await db.settings.get(settingsKey);
    if (s?.value && s.value.trim() !== "test-key") return s.value.trim();
  } catch (e) {}
  return undefined;
};

// Exponential backoff retry for 429 and 500/503 errors
const retryWithBackoff = async (
  error: AxiosError,
  maxRetries = 3,
): Promise<void> => {
  const retryableStatuses = [429, 500, 502, 503];
  if (!error.response?.status || !retryableStatuses.includes(error.response.status)) {
    throw error;
  }

  const retryCount = (error.config as any)?._retryCount || 0;
  if (retryCount >= maxRetries) {
    logger.error(`Max retries (${maxRetries}) exceeded for ${error.config?.url}`, "apiClient");
    throw error;
  }

  const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Max 10 seconds
  (error.config as any)._retryCount = retryCount + 1;

  logger.warn(`Retry ${retryCount + 1}/${maxRetries} after ${delay}ms for ${error.response?.status}`, "apiClient");
  await new Promise((resolve) => setTimeout(resolve, delay));
};

export const createApiClient = (
  baseURL: string,
  timeout = 15000,
): AxiosInstance => {
  const client = axios.create({
    baseURL,
    timeout,
    validateStatus: (status) => status < 400, // Только 2xx успешные
  });

  // Response interceptor for retryable errors (429, 500, 502, 503)
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const retryableStatuses = [429, 500, 502, 503];
      if (error.response?.status && retryableStatuses.includes(error.response.status)) {
        try {
          await retryWithBackoff(error);
          return await client.request(error.config!);
        } catch (retryError) {
           // If we've exhausted retries on a 429, return an empty/default response to avoid unhandled promise rejections crashing UI
           if (error.response?.status === 429 && error.config?.url?.includes("googleapis")) {
             return { data: { items: [], results: [] }, status: 200, statusText: "OK (Rate Limited Fallback)", headers: {}, config: error.config! };
           }
           throw retryError;
        }
      }
      throw error;
    },
  );

  return client;
};

export const tmdbClient = createApiClient("/api/tmdb");

export const rawgClient = createApiClient("/api/rawg");
export const googleBooksClient = createApiClient(
  "https://www.googleapis.com/books/v1",
);
export const kinopoiskClient = createApiClient("/api/kinopoisk");


// --- TMDB Interceptor ---
tmdbClient.interceptors.request.use(async (config) => {
  const stored = await getStoredKey("tmdb_key");
  const envKey = import.meta.env.VITE_TMDB_API_KEY;
  const key = (stored || envKey)?.trim();
  if (key) config.params = { ...config.params, api_key: key };
  return config;
});

// --- RAWG Interceptor ---
rawgClient.interceptors.request.use(async (config) => {
  const stored = await getStoredKey("rawg_key");
  const envKey = import.meta.env.VITE_RAWG_API_KEY;
  const key = (stored || envKey)?.trim();

  if (key) {
    config.params = { ...config.params, key: key };
  } else {
    logger.warn("RAWG key is missing!", "apiClient");
  }
  return config;
});

// --- Google Books Interceptor ---
googleBooksClient.interceptors.request.use(async (config) => {
  const key =
    (await getStoredKey("google_books_key")) ||
    import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
  if (key) config.params = { ...config.params, key: key };
  return config;
});

// --- Kinopoisk Interceptor ---
kinopoiskClient.interceptors.request.use(async (config) => {
  const stored = await getStoredKey("kinopoisk_key");
  const envKey = import.meta.env.VITE_KINOPOISK_API_KEY;
  const key = (stored || envKey)?.trim();
  if (key) {
    config.headers = config.headers || {};
    config.headers["X-API-KEY"] = key;
    config.headers["Content-Type"] = "application/json";
  } else {
    logger.warn("Kinopoisk key is missing!", "apiClient");
  }
  return config;
});

// Kinopoisk response interceptor - silently handle 400/404 for trailers/similars
kinopoiskClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Handle 429 rate limiting
    if (error.response?.status === 429) {
      return retryWithBackoff(error).then(() =>
        kinopoiskClient.request(error.config!),
      );
    }
    // Silently ignore 400/404 for trailers and similars endpoints
    const url = error.config?.url || "";
    if (
      error.response?.status === 400 ||
      error.response?.status === 404
    ) {
      if (url.includes("/trailers") || url.includes("/similars") || url.includes("/seasons")) {
        // Suppress console error for these expected 400/404 responses
        const originalConsoleError = console.error;
        console.error = () => {}; // Temporarily suppress console.error
        try {
          const result = {
            status: error.response.status,
            statusText: error.response.statusText,
            data: { items: [] },
            headers: error.response.headers,
            config: error.config!,
          };
          return result;
        } finally {
          console.error = originalConsoleError; // Restore console.error
        }
      }
    }
    throw error;
  },
);

// Add validateStatus interceptor for kinopoisk to prevent 400/404 from being errors
kinopoiskClient.interceptors.request.use((config) => {
  const url = config.url || "";
  // Don't treat 400/404 as errors for these endpoints
  if (url.includes("/trailers") || url.includes("/similars") || url.includes("/seasons")) {
    config.validateStatus = (status) => status < 500;
  }
  return config;
});
