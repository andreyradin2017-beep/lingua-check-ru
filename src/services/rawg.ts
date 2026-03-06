import { rawgClient } from "./apiClient";
import type { Item } from "../types";
import type { RAWGSearchResponse, RAWGGame } from "../types/api";
import { fetchHLTBStats } from "./hltb";
import { logger } from "../utils/logger";

export const searchGames = async (query: string): Promise<Item[] | null> => {
  // Prevent search with empty/undefined query
  if (!query || query.trim() === "") {
    return null;
  }

  try {
    const response = await rawgClient.get<RAWGSearchResponse>("/games", {
      params: {
        search: query,
        page_size: 20,
        language: "ru",
      },
    });

    const data = response.data;
    if (!data?.results) return null;

    return data.results.map((game) => ({
      title: game.name,
      type: "game",
      status: "planned",
      image: game.background_image,
      description: undefined,
      year: game.released ? new Date(game.released).getFullYear() : undefined,
      rating: game.rating,
      source: "rawg" as const,
      externalId: game.id.toString(),
      tags: game.genres.map((g) => g.name),
      platforms: game.platforms?.map((p) => p.platform.name) || [],
      metacriticScore: game.metacritic,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  } catch (error) {
    logger.error("RAWG Search Error", "rawg", error);
    return null;
  }
};

export const getGameDetails = async (id: string): Promise<any> => {
  try {
    const response = await rawgClient.get<RAWGGame>(`/games/${id}`, {
      params: {
        language: "ru",
      },
    });
    const data = response.data;
    if (!data) return null;

    let related: any[] = [];
    try {
      const relatedRes = await rawgClient.get(`/games/${id}/additions`);
      const rawRelated = relatedRes.data?.results || [];
      related = rawRelated.map((g: any) => ({
        title: g.name,
        type: "game",
        status: "planned",
        image: g.background_image,
        year: g.released ? new Date(g.released).getFullYear() : undefined,
        rating: g.rating,
        source: "rawg" as const,
        externalId: g.id.toString(),
        tags: g.genres?.map((gen: any) => gen.name) || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      })).slice(0, 8);
    } catch (err: any) {
      // Ignore 401/403 errors for free API keys
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        logger.warn("RAWG related games fetch failed", "rawg", err);
      }
    }

    let screenshots: string[] = [];
    try {
      const screensRes = await rawgClient.get(`/games/${id}/screenshots`);
      screenshots = screensRes.data?.results?.map((s: any) => s.image) || [];
    } catch (err: any) {
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        logger.warn("RAWG screenshots fetch failed", "rawg", err);
      }
    }

    const hltb = await fetchHLTBStats(data.name);

    // Strip HTML tags from description
    const cleanDescription = (data.description_raw || data.description || "")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();

    return {
      title: data.name,
      image: data.background_image,
      description: cleanDescription,
      related,
      hltb,
      providers: [],
      type: "game",
      platforms: data.platforms?.map((p) => p.platform.name) || [],
      developers: data.developers?.map((d) => d.name) || [],
      publishers: data.publishers?.map((p) => p.name) || [],
      metacriticScore: data.metacritic,
      esrbRating: data.esrb_rating?.name,
      playtime: data.playtime,
      website: data.website,
      screenshots,
    };
  } catch (error) {
    logger.error("RAWG Details Error", "rawg", error);
    return null;
  }
};

export const getPopularGames = async (): Promise<string[]> => {
  try {
    const response = await rawgClient.get<RAWGSearchResponse>("/games", {
      params: {
        ordering: "-added",
        page_size: 6,
        language: "ru",
      },
    });
    const data = response.data;
    return (data?.results || []).map((game) => game.name);
  } catch (error) {
    logger.error("RAWG Popular Error", "rawg", error);
    return [];
  }
};
