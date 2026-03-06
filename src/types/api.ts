export interface TMDBMovie {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  overview: string;
  release_date?: string;
  first_air_date?: string;
  media_type: "movie" | "tv";
  genres?: { id: number; name: string }[];
  genre_ids?: number[];
  vote_average?: number;
}

export interface TMDBSearchResponse {
  results: TMDBMovie[];
}

export interface TMDBVideo {
  key: string;
  site: string;
  type: string;
}

export interface TMDBWatchProviders {
  results: {
    [key: string]: {
      link?: string;
      flatrate?: { provider_name: string; logo_path: string }[];
      rent?: { provider_name: string; logo_path: string }[];
      buy?: { provider_name: string; logo_path: string }[];
    };
  };
}

export interface RAWGGame {
  id: number;
  name: string;
  background_image: string;
  released: string;
  rating: number;
  genres: { name: string }[];
  description_raw?: string;
  description?: string;
  platforms?: { platform: { name: string; id: number } }[];
  metacritic?: number;
  developers?: { name: string }[];
  publishers?: { name: string }[];
  stores?: { store: { name: string; id: number } }[];
  esrb_rating?: { name: string; slug: string };
  playtime?: number;
  website?: string;
}

export interface RAWGSearchResponse {
  results: RAWGGame[];
}

export interface GoogleBook {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    imageLinks?: { thumbnail: string };
    publishedDate?: string;
    categories?: string[];
  };
}

export interface GoogleBooksResponse {
  items?: GoogleBook[];
}

// Kinopoisk API Types
export interface KinopoiskFilm {
  filmId: number;
  nameRu?: string;
  nameEn?: string;
  nameOriginal?: string;
  posterUrl?: string;
  posterUrlPreview?: string;
  type: "FILM" | "TV_SERIES" | "TV_SHOW" | "MINI_SERIES" | "VIDEO";
  year?: string;
  description?: string;
  rating?: string;
  ratingKinopoisk?: string;
  ratingImdb?: string;
  genres?: { genre: string }[];
}

export interface KinopoiskSearchResponse {
  films: KinopoiskFilm[];
  pagesCount: number;
  page: number;
}

export interface KinopoiskFilmDetails {
  kinopoiskId: number;
  filmId?: number; // Legacy, kept for compatibility
  nameRu?: string;
  nameEn?: string;
  nameOriginal?: string;
  posterUrl?: string;
  posterUrlPreview?: string;
  type: "FILM" | "TV_SERIES" | "TV_SHOW" | "MINI_SERIES" | "VIDEO";
  year?: string | number;
  description?: string;
  rating?: string | number;
  ratingKinopoisk?: string | number;
  ratingImdb?: string | number;
  genres?: { genre: string }[];
  countries?: { country: string }[];
  duration?: number;
  filmLength?: number;
  slogan?: string;
  ageRating?: string;
  ratingMpaa?: string;
  ratingAgeLimits?: number;
}

export interface KinopoiskSeason {
  number: number;
  episodes?: KinopoiskEpisode[];
}

export interface KinopoiskEpisode {
  episodeNumber: number;
  nameRu?: string;
  nameEn?: string;
  synopsis?: string;
  releaseDate?: string;
}

export interface KinopoiskStaff {
  staffId: number;
  nameRu?: string;
  nameEn?: string;
  description?: string;
  profession?: string;
  posterUrl?: string;
}

export interface KinopoiskFact {
  factId: number;
  type: "TEXT" | "IMAGE";
  value: string;
  spoiler: boolean;
  likeCount: number;
  dateCreated: string;
}

export interface KinopoiskReview {
  reviewId: number;
  authorNameRu?: string;
  authorNameEn?: string;
  description: string;
  date: string;
  rating: number;
  isPositive: boolean;
}

export interface KinopoiskSimilarFilm {
  filmId: number;
  nameRu?: string;
  nameEn?: string;
  posterUrl?: string;
  rating?: string;
}

export interface KinopoiskTrailer {
  trailerId: number;
  url: string;
  name?: string;
  site: "YOUTUBE" | "VK" | "OTHER";
  type: "TRAILER" | "TEASER";
}

export interface KinopoiskTopResponse {
  items: KinopoiskFilm[];
  pagesCount: number;
  page: number;
}

export interface KinopoiskFiltersResponse {
  genres: { genre: string }[];
  countries: { country: string }[];
  ratingKinopoisk: { min: number; max: number };
  ratingImdb: { min: number; max: number };
  year: { min: number; max: number };
}
