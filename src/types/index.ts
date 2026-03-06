export type ItemType = "movie" | "show" | "game" | "book" | "other";
export type ItemStatus = "planned" | "in_progress" | "completed";

export interface Item {
  id?: number;
  title: string;
  type: ItemType;
  status: ItemStatus;
  image?: string;
  description?: string;
  year?: number;
  rating?: number; // User rating 0-10
  progress?: number; // e.g. episodes watched, pages read
  totalProgress?: number; // total episodes, total pages

  // Series support
  currentSeason?: number;
  currentEpisode?: number;
  episodesPerSeason?: number[]; // count of episodes in each season

  // Archive support
  isArchived?: boolean;

  // API Metadata
  trailerUrl?: string;
  watchProviders?: { name: string; logo: string; url?: string }[];
  releaseDate?: Date; // Release date for upcoming content
  relatedExternalIds?: string[];
  platforms?: string[]; // Gaming platforms (PC, PlayStation, Xbox)
  developers?: string[];
  publishers?: string[];
  metacriticScore?: number;
  esrbRating?: string;
  playtime?: number; // Hours
  website?: string;

  notes?: string;
  tags: string[];
  externalId?: string;
  authors?: string[];
  source?: "tmdb" | "kinopoisk" | "rawg" | "google_books" | "litres" | "manual";
  supabaseId?: string; // UUID from Supabase
  createdAt: Date;
  updatedAt: Date;
  listId?: number;
}

export interface List {
  id?: number;
  supabaseId?: string; // UUID from Supabase
  name: string;
  icon?: string;
  description?: string;
  createdAt: Date;
  updatedAt?: Date; // Added for sync
}

export interface Settings {
  key: string;
  value: any;
}

export type SearchProviderId = "tmdb" | "kinopoisk" | "rawg" | "google_books" | "litres";

export interface SearchProvider {
  id: SearchProviderId;
  enabled: boolean;
  priority: number;
}
