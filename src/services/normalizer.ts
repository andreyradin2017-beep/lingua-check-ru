import type { Item, ItemType, ItemStatus } from "../types";
import { getProxiedImageUrl } from "../utils/images";

/**
 * Normalizes an Item object, fixing common issues (missing types, legacy statuses, image proxies).
 */
export const normalizeItem = (item: Partial<Item>): Item => {
  const now = new Date();

  // 1. Fix Status (Handle legacy 'dropped' or null)
  let status: ItemStatus = "planned";
  if (item.status === "in_progress" || item.status === "completed") {
    status = item.status;
  }
  // Any other status (like 'dropped') maps to 'planned'

  // 2. Fix Type (Infer if missing)
  let type: ItemType = item.type || "other";
  if (!item.type && item.source) {
    if (item.source === "rawg") {
      type = "game";
    } else if (item.source === "google_books" || item.source === "litres") {
      type = "book";
    } else if (item.source === "tmdb" || item.source === "kinopoisk") {
      // Default to movie for these sources if type is unknown
      type = "movie";
    }
  }

  // 3. Normalize Image (Ensure proxy is used)
  const image = getProxiedImageUrl(item.image);

  return {
    ...item,
    title: item.title || "",
    type,
    status,
    image,
    tags: item.tags || [],
    createdAt: item.createdAt || now,
    updatedAt: item.updatedAt || now,
  } as Item;
};

/**
 * Validates if an item has required fields for storage.
 */
export const isValidItem = (item: Partial<Item>): boolean => {
  return !!(item.title && item.type);
};

/**
 * Normalizes image URL specifically for migration/legacy cleanup.
 */
export const fixLegacyImageUrl = (
  url: string | undefined,
): string | undefined => {
  if (!url) return undefined;

  // Handle old TMDB image format from previous versions
  if (url.includes("/api/tmdb-image")) {
    try {
      const searchParams = new URL(url, window.location.origin).searchParams;
      const path = searchParams.get("path");
      if (path) {
        return `https://wsrv.nl/?url=${encodeURIComponent("https://image.tmdb.org/t/p" + path)}`;
      }
    } catch (e) {
      // Fallback if URL parsing fails
    }
  }

  return getProxiedImageUrl(url);
};
