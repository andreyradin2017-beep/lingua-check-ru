import { db } from "../db/db";
import type { Item } from "../types";
import { searchMovies, getMovieDetails, getTrendingMovies } from "./tmdb";
import { searchGames, getGameDetails, getPopularGames } from "./rawg";
import { searchBooks, getBookDetails } from "./googleBooks";
import {
  searchKinopoisk,
  getKinopoiskDetails,
  getKinopoiskTop,
} from "./kinopoisk";
import { searchLitres, getLitresDetails } from "./litres";
import { logger } from "../utils/logger";

// Cache TTL from environment or default to 30 days (2592000000 ms)
const CACHE_TTL = Number(import.meta.env.VITE_CACHE_TTL) || 30 * 24 * 60 * 60 * 1000;

const getCachedData = async (key: string): Promise<any | null> => {
  const cached = await db.cache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    await db.cache.delete(key);
    return null;
  }
  return cached.data;
};

const setCachedData = async (key: string, data: any) => {
  await db.cache.put({ key, data, timestamp: Date.now() });
};

export const searchAll = async (
  query: string,
  options?: { includeBooks?: boolean },
): Promise<Item[]> => {
  // Prevent search with empty/undefined query
  if (!query || query.trim() === "") {
    return [];
  }

  const includeBooks = options?.includeBooks ?? true;
  const cacheKey = `search_all_${query}_books${includeBooks}`;
  const cached = await getCachedData(cacheKey);
  if (cached) return cached;

  const providersArr = await db.search_providers.toArray();
  const enabledProviders = providersArr.filter((p) => p.enabled);

  if (enabledProviders.length === 0) return [];

  const searchTasks: { id: string; promise: Promise<any> }[] = [];
  if (enabledProviders.some((p) => p.id === "tmdb"))
    searchTasks.push({ id: "tmdb", promise: searchMovies(query) });
  if (enabledProviders.some((p) => p.id === "kinopoisk"))
    searchTasks.push({ id: "kinopoisk", promise: searchKinopoisk(query) });
  if (enabledProviders.some((p) => p.id === "rawg"))
    searchTasks.push({ id: "rawg", promise: searchGames(query) });
  if (includeBooks && enabledProviders.some((p) => p.id === "google_books"))
    searchTasks.push({ id: "google_books", promise: searchBooks(query) });
  if (includeBooks && enabledProviders.some((p) => p.id === "litres"))
    searchTasks.push({ id: "litres", promise: searchLitres(query) });

  const settledTasks = await Promise.allSettled(
    searchTasks.map(async (task) => {
      const res = await task.promise;
      return { id: task.id, results: res || [] };
    }),
  );

  const finalResults: Item[] = [];
  settledTasks.forEach((res) => {
    if (res.status === "fulfilled") {
      finalResults.push(...res.value.results);
    }
  });

  if (finalResults.length > 0) {
    await setCachedData(cacheKey, finalResults);
  }

  return finalResults;
};

export const searchByCategory = async (
  query: string,
  category: "movie" | "game" | "book",
): Promise<Item[]> => {
  // Prevent search with empty/undefined query
  if (!query || query.trim() === "") {
    return [];
  }

  const cacheKey = `search_${category}_${query}`;
  const cached = await getCachedData(cacheKey);
  if (cached) return cached;

  // Load enabled providers from DB
  const { db } = await import("../db/db");
  const providers = await db.search_providers.toArray();
  const isEnabled = (id: string) => {
    const p = providers.find(pr => pr.id === id);
    return p ? p.enabled : true; // default to enabled if not in DB yet
  };

  let results: Item[] = [];
  try {
    if (category === "movie") {
      const calls: (Promise<Item[] | null> | Promise<Item[]>)[] = [];
      if (isEnabled("tmdb")) calls.push(searchMovies(query));
      if (isEnabled("kinopoisk")) calls.push(searchKinopoisk(query));
      const all = await Promise.all(calls);
      results = all.filter(Boolean).flat() as Item[];
    } else if (category === "game") {
      if (isEnabled("rawg")) results = (await searchGames(query)) || [];
    } else if (category === "book") {
      const calls: (Promise<Item[] | null> | Promise<Item[]>)[] = [];
      if (isEnabled("google_books")) calls.push(searchBooks(query));
      if (isEnabled("litres")) calls.push(searchLitres(query));
      const all = await Promise.all(calls);
      results = all.filter(Boolean).flat() as Item[];
    }
  } catch (e) {
    logger.error(`Search category ${category} failed`, "api", e);
  }

  if (results.length > 0) {
    await setCachedData(cacheKey, results);
  }
  return results;
};

export const getDetails = async (item: Item): Promise<any> => {
  const cacheKey = `details_${item.source}_${item.externalId}`;
  const cached = await getCachedData(cacheKey);
  if (cached) return cached;

  let data = null;
  try {
    if (item.source === "tmdb")
      data = await getMovieDetails(item.externalId!, item.type as any);
    else if (item.source === "kinopoisk")
      data = await getKinopoiskDetails(item.externalId!);
    else if (item.source === "rawg")
      data = await getGameDetails(item.externalId!);
    else if (item.source === "google_books")
      data = await getBookDetails(item.externalId!);
    else if (item.source === "litres")
      data = await getLitresDetails(item.externalId!);
  } catch (e) {
    logger.error(`Get details failed for ${item.source}`, "api", e);
  }

  if (data) await setCachedData(cacheKey, data);
  return data;
};

export const getTrending = async (
  category: "movie" | "game" | "all",
): Promise<string[]> => {
  try {
    if (category === "movie") {
      // Combine TMDB trending with Kinopoisk top
      const [tmdbRes, kinopoiskTopRes] = await Promise.allSettled([
        getTrendingMovies(),
        getKinopoiskTop("ALL", 1),
      ]);
      const kinopoiskTop = kinopoiskTopRes.status === "fulfilled" ? kinopoiskTopRes.value : [];
      const kinopoiskTitles = kinopoiskTop.map((f) => f.title);
      const tmdbTrending = tmdbRes.status === "fulfilled" ? tmdbRes.value : [];
      return [...tmdbTrending, ...kinopoiskTitles].slice(0, 10);
    }
    if (category === "game") return await getPopularGames();

    const [m, g] = await Promise.allSettled([
      getTrendingMovies(),
      getPopularGames(),
    ]);
    const movies = m.status === "fulfilled" ? m.value : [];
    const games = g.status === "fulfilled" ? g.value : [];

    const combined = [];
    for (let i = 0; i < Math.max(movies.length, games.length); i++) {
      if (movies[i]) combined.push(movies[i]);
      if (games[i]) combined.push(games[i]);
    }
    return combined.slice(0, 8);
  } catch (e) {
    logger.error("Get trending failed", "api", e);
    return [];
  }
};
