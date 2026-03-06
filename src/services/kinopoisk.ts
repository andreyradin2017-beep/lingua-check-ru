import { kinopoiskClient } from "./apiClient";
import type { Item } from "../types";
import type {
  KinopoiskSearchResponse,
  KinopoiskFilmDetails,
  KinopoiskTopResponse,
  KinopoiskFiltersResponse,
  KinopoiskTrailer,
  KinopoiskSimilarFilm,
  KinopoiskSeason,
  KinopoiskFilm,
} from "../types/api";
import { getProxiedImageUrl } from "../utils/images";
import { logger } from "../utils/logger";
import { KINOPOISK_GENRE_MAP } from "../utils/genreMaps";

import { normalizeItem } from "./normalizer";

const mapKinopoiskFilm = (film: KinopoiskFilm): Item =>
  normalizeItem({
    title: film.nameRu || film.nameEn || film.nameOriginal || "",
    type:
      film.type === "TV_SERIES" || film.type === "TV_SHOW" || film.type === "MINI_SERIES" ? "show" : "movie",
    status: "planned",
    image: film.posterUrl || film.posterUrlPreview,
    description: film.description,
    year: film.year && film.year !== "null" ? parseInt(film.year) : undefined,
    source: "kinopoisk",
    externalId: film.filmId?.toString(),
    tags:
      film.genres
        ?.slice(0, 3)
        .map((g: { genre: string }) => KINOPOISK_GENRE_MAP[g.genre?.toLowerCase()] || g.genre)
        .filter(Boolean) || [],
    rating:
      film.rating && film.rating !== "null"
        ? parseFloat(film.rating)
        : film.ratingKinopoisk
          ? parseFloat(film.ratingKinopoisk)
          : undefined,
  });

export const searchKinopoisk = async (query: string): Promise<Item[] | null> => {
  // Prevent search with empty/undefined query
  if (!query || query.trim() === "") {
    return null;
  }

  try {
    console.log("[Kinopoisk] Searching for:", query);
    const response = await kinopoiskClient.get<KinopoiskSearchResponse>(
      "/v2.1/films/search-by-keyword",
      {
        params: { keyword: query },
      },
    );

    console.log("[Kinopoisk] Response:", response.data);
    const data = response.data;
    if (!data?.films) return null;

    const results = data.films.slice(0, 20).map(mapKinopoiskFilm);
    console.log("[Kinopoisk] Results count:", results.length);
    return results;
  } catch (error: any) {
    console.error("[Kinopoisk] Search Error:", error.message);
    logger.warn("Kinopoisk API недоступен", "kinopoisk", error);
    return null;
  }
};

export const getKinopoiskDetails = async (id: string): Promise<any> => {
  try {
    const response = await kinopoiskClient.get<KinopoiskFilmDetails>(
      `/v2.2/films/${id}`,
    );

    const details = response.data;
    if (!details) return null;

    // Fetch trailers, similars, seasons and staff in parallel with error suppression
    const [trailersRes, similarsRes, seasonsRes, staffRes] = await Promise.all([
      kinopoiskClient.get<{ items: KinopoiskTrailer[] }>(
        `/v2.2/films/${id}/videos`,
        { validateStatus: (status) => status < 500 }, // Don't throw on 4xx
      ).then((r) => (r.status === 200 ? r : null)).catch(() => null),
      kinopoiskClient.get<{ items: KinopoiskSimilarFilm[] }>(
        `/v2.2/films/${id}/similars`,
        { validateStatus: (status) => status < 500 },
      ).then((r) => (r.status === 200 ? r : null)).catch(() => null),
      // Fetch seasons for TV shows
      details.type === "TV_SERIES" || details.type === "MINI_SERIES"
        ? kinopoiskClient.get<{ total: number; items: KinopoiskSeason[] }>(
            `/v2.2/films/${id}/seasons`,
            { validateStatus: (status) => status < 500 },
          ).then((r) => (r.status === 200 ? r : null)).catch(() => null)
        : Promise.resolve(null),
      // Fetch staff
      kinopoiskClient.get<any[]>(
        `/v1/staff?filmId=${id}`,
        { validateStatus: (status) => status < 500 },
      ).then((r) => (r.status === 200 ? r : null)).catch(() => null),
    ]);

    const trailersData = trailersRes?.data || null;
    const similarsData = similarsRes?.data || null;
    const seasonsData = seasonsRes?.data || null;
    const staffData = staffRes?.data || null;

    const trailer = trailersData?.items?.find(
      (t) => t.site === "YOUTUBE" && t.type === "TRAILER",
    );

    // Get episodes per season from Kinopoisk
    // API returns { total: N, items: KinopoiskSeason[] }
    // seasonsData is already the unwrapped response body (AxiosResponse.data)
    const seasonsDataArray = seasonsData?.items;
    const episodesPerSeason = seasonsDataArray
      ? seasonsDataArray
          .filter((s: any) => s.number > 0)
          .map((s: any) => (s.episodes as any[])?.length || 0)
      : undefined;

    const totalEpisodes = episodesPerSeason
      ? episodesPerSeason.reduce((sum: number, count: number) => sum + count, 0)
      : undefined;

    return {
      title: details.nameRu || details.nameEn || details.nameOriginal || (details as any).nameKinopoisk || "",
      image:
        details.posterUrl && !details.posterUrl.includes("no-poster")
          ? getProxiedImageUrl(details.posterUrl)
          : undefined,
      description: details.description,
      genres:
        details.genres?.map((g: any) => KINOPOISK_GENRE_MAP[g.genre?.toLowerCase()] || g.genre) || [],
      countries: details.countries?.map((c: any) => c.country) || [],
      type: (details.type === "TV_SERIES" || details.type === "TV_SHOW" || details.type === "MINI_SERIES") ? "show" : "movie",
      year:
        details.year && details.year !== "null"
          ? parseInt(String(details.year))
          : undefined,
      rating:
        details.rating && details.rating !== "null"
          ? parseFloat(String(details.rating))
          : details.ratingKinopoisk
            ? parseFloat(String(details.ratingKinopoisk))
            : undefined,
      duration: details.duration || details.filmLength,
      slogan: details.slogan,
      ageRating: details.ageRating || details.ratingAgeLimits,
      trailer: trailer
        ? `https://www.youtube.com/embed/${trailer.url.split("/").pop()}`
        : undefined,
      providers: [
        {
          name: "Кинопоиск",
          logo: "https://www.google.com/s2/favicons?domain=kinopoisk.ru&sz=128",
          url: `https://www.kinopoisk.ru/film/${id}/`,
        }
      ],
      related:
        similarsData?.items
          ?.filter((s: KinopoiskSimilarFilm) => s.nameRu || s.nameEn)
          .slice(0, 8)
          .map((s: KinopoiskSimilarFilm) => ({
            externalId: s.filmId.toString(),
            title: s.nameRu || s.nameEn || "",
            image:
              s.posterUrl && !s.posterUrl.includes("no-poster")
                ? getProxiedImageUrl(s.posterUrl)
                : undefined,
            type: (details.type === "TV_SERIES" || details.type === "TV_SHOW" || details.type === "MINI_SERIES") ? "show" : "movie",
            source: "kinopoisk" as const,
          })) || [],
      cast: (staffData || [])
        .filter((s: any) => s.professionKey === "ACTOR")
        .slice(0, 15)
        .map((s: any) => ({
          name: s.nameRu || s.nameEn || "",
          character: s.description || "",
          image: s.posterUrl ? getProxiedImageUrl(s.posterUrl) : undefined,
        })),
      // TV Show specific data
      totalEpisodes,
      episodesPerSeason,
    };
  } catch (error) {
    logger.warn("Kinopoisk Details Error", "kinopoisk", error);
    return null;
  }
};

export const getKinopoiskTop = async (
  type: "FILM" | "TV_SERIES" | "ALL" = "ALL",
  page = 1,
): Promise<Item[]> => {
  try {
    // Kinopoisk API only supports certain types, use empty string for all
    const apiType = type === "ALL" ? "" : type;
    const response = await new Promise<any>((resolve) => {
      kinopoiskClient
        .get<KinopoiskTopResponse>("/v2.2/films/top", {
          params: { type: apiType, page },
        })
        .then(resolve)
        .catch(() => resolve(null));
    });

    if (!response) return [];
    const data = response.data;
    if (!data?.items) return [];

    return data.items.map(mapKinopoiskFilm);
  } catch (error) {
    return [];
  }
};

export const getKinopoiskFilters = async (): Promise<{
  genres: string[];
  countries: string[];
  yearRange: { min: number; max: number };
  ratingKinopoiskRange: { min: number; max: number };
  ratingImdbRange: { min: number; max: number };
}> => {
  try {
    const response = await kinopoiskClient.get<KinopoiskFiltersResponse>(
      "/v2.2/films/filters",
    );

    const data = response.data;
    if (!data) {
      return {
        genres: [],
        countries: [],
        yearRange: { min: 0, max: 0 },
        ratingKinopoiskRange: { min: 0, max: 0 },
        ratingImdbRange: { min: 0, max: 0 },
      };
    }

    return {
      genres: data.genres.map((g: { genre: string }) => KINOPOISK_GENRE_MAP[g.genre] || g.genre),
      countries: data.countries.map((c: { country: string }) => c.country),
      yearRange: data.year,
      ratingKinopoiskRange: data.ratingKinopoisk,
      ratingImdbRange: data.ratingImdb,
    };
  } catch (error) {
    logger.warn("Kinopoisk Filters Error", "kinopoisk", error);
    return {
      genres: [],
      countries: [],
      yearRange: { min: 0, max: 0 },
      ratingKinopoiskRange: { min: 0, max: 0 },
      ratingImdbRange: { min: 0, max: 0 },
    };
  }
};

export const getKinopoiskTrailers = async (
  id: string,
): Promise<{ url: string; name?: string; type: string }[]> => {
  try {
    const response = await kinopoiskClient.get<{ items: KinopoiskTrailer[] }>(
      `/v2.1/films/${id}/trailers`,
    );

    const data = response.data;
    if (!data?.items) return [];

    return data.items
      .filter((t) => t.site === "YOUTUBE")
      .map((t) => ({
        url: `https://www.youtube.com/embed/${t.url.split("/").pop()}`,
        name: t.name,
        type: t.type,
      }));
  } catch (error) {
    logger.warn("Kinopoisk Trailers Error", "kinopoisk", error);
    return [];
  }
};

export const getKinopoiskSimilars = async (
  id: string,
): Promise<Item[]> => {
  try {
    const response = await kinopoiskClient.get<{ items: KinopoiskSimilarFilm[] }>(
      `/v2.1/films/${id}/similars`,
    );

    const data = response.data;
    if (!data?.items) return [];

    return data.items
      .filter((film) => film.nameRu || film.nameEn)
      .slice(0, 10)
      .map((film) => ({
        title: film.nameRu || film.nameEn || "",
        type: "movie" as const,
        status: "planned" as const,
        image:
          film.posterUrl && !film.posterUrl.includes("no-poster")
            ? getProxiedImageUrl(film.posterUrl)
            : undefined,
        source: "kinopoisk" as const,
        externalId: film.filmId.toString(),
        tags: [],
        rating:
          film.rating && film.rating !== "null"
            ? parseFloat(film.rating)
            : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
  } catch (error) {
    logger.warn("Kinopoisk Similars Error", "kinopoisk", error);
    return [];
  }
};
