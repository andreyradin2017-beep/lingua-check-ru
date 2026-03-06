import { db } from "../db/db";
import type { Item } from "../types";
import { getProxiedImageUrl } from "../utils/images";
import { tmdbClient, rawgClient } from "./apiClient";
import { logger } from "../utils/logger";
import { TMDB_GENRE_MAP } from "../utils/genreMaps";

interface DiscoverData {
  trending: Item[];
  upcoming: Item[];
  newGames: Item[];
  upcomingGames: Item[];
  newBooks: Item[];
  trendingBooks: Item[];
}

const RAWG_GENRE_MAP: Record<string, string> = {
  Action: "Экшен",
  Adventure: "Приключения",
  RPG: "RPG",
  Shooter: "Экшен",
  Puzzle: "Пазл",
  Racing: "Гонки",
  Sports: "Спорт",
  Strategy: "Стратегия",
  Simulation: "Симулятор",
  Fighting: "Файтинг",
  Family: "Семейный",
  "Board Games": "Настольные",
};

export const getDiscoverData = async (): Promise<DiscoverData> => {
  const cacheKey = "discover_data_v13";
  const cached = await db.cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < 6 * 60 * 60 * 1000) {
    return cached.data;
  }

  try {
    const today = new Date();
    const last30Days = new Date(today);
    last30Days.setDate(today.getDate() - 30);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const next6Months = new Date(today);
    next6Months.setMonth(today.getMonth() + 6);

    const formatDate = (date: Date) => date.toISOString().split("T")[0];

    const results = await Promise.allSettled([
      tmdbClient.get<any>("/trending/all/week", {
        params: { language: "ru-RU" },
      }),
      tmdbClient.get<any>("/movie/upcoming", {
        params: { language: "ru-RU", region: "RU" },
      }),
      rawgClient.get<any>("/games", {
        params: {
          dates: `${formatDate(last30Days)},${formatDate(today)}`,
          ordering: "-added",
          page_size: 10,
        },
      }),
      rawgClient.get<any>("/games", {
        params: {
          dates: `${formatDate(tomorrow)},${formatDate(next6Months)}`,
          ordering: "-added",
          page_size: 10,
        },
      }),
      // Simple searches for trending/new books since LitRes has no specific "trending" endpoint
      // Using searchLitres or similar could work but LitRes results are usually relevant
      import("./litres").then(m => m.searchLitres("бестселлер")),
      import("./litres").then(m => m.searchLitres("новинки")),
    ]);

    const trendingData =
      results[0].status === "fulfilled" ? results[0].value.data?.results : [];
    const upcomingData =
      results[1].status === "fulfilled" ? results[1].value.data?.results : [];
    const newGamesData =
      results[2].status === "fulfilled" ? results[2].value.data?.results : [];
    const trendingGamesData =
      results[3].status === "fulfilled" ? results[3].value.data?.results : [];
    const trendingBooks =
      results[4].status === "fulfilled" ? results[4].value : [];
    const newBooks =
      results[5].status === "fulfilled" ? results[5].value : [];

    const mapTmdbItems = (items: any[] = []): Item[] =>
      items.slice(0, 10).map((item) => ({
        title: item.title || item.name,
        type: item.media_type === "tv" ? "show" : "movie",
        status: "planned",
        image: item.poster_path
          ? getProxiedImageUrl(
              `https://image.tmdb.org/t/p/w500${item.poster_path}`,
            )
          : undefined,
        year:
          item.release_date || item.first_air_date
            ? new Date(item.release_date || item.first_air_date).getFullYear()
            : undefined,
        externalId: item.id.toString(),
        source: "tmdb" as const,
        tags:
          item.genre_ids?.map((id: number) => TMDB_GENRE_MAP[id]).filter(Boolean) ||
          [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

    const mapRawgItems = (items: any[] = []): Item[] =>
      items.slice(0, 10).map((game) => ({
        title: game.name,
        type: "game",
        status: "planned",
        image: game.background_image
          ? getProxiedImageUrl(game.background_image)
          : undefined,
        year: game.released ? new Date(game.released).getFullYear() : undefined,
        externalId: game.id.toString(),
        source: "rawg" as const,
        tags:
          game.genres
            ?.map((g: any) => RAWG_GENRE_MAP[g.name] || g.name)
            .filter(Boolean) || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

    const data: DiscoverData = {
      trending: mapTmdbItems(trendingData),
      upcoming: mapTmdbItems(upcomingData),
      newGames: mapRawgItems(newGamesData),
      upcomingGames: mapRawgItems(trendingGamesData),
      trendingBooks: trendingBooks.slice(0, 10),
      newBooks: newBooks.slice(0, 10),
    };

    await db.cache.put({ key: cacheKey, data, timestamp: Date.now() });
    return data;
  } catch (error) {
    logger.error("Discover data fetch failed", "discover", error);
    return { trending: [], upcoming: [], newGames: [], upcomingGames: [], trendingBooks: [], newBooks: [] };
  }
};
