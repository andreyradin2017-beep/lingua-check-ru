import axios from "axios";
import type { Item } from "../types";
import { logger } from "../utils/logger";

/**
 * Recognizes media information from a URL using Open Graph metadata.
 */
export const recognizeMediaFromUrl = async (
  url: string,
): Promise<Partial<Item> | null> => {
  try {
    // Basic validation
    if (!url.startsWith("http")) return null;

    // Use a proxy to bypass CORS (switching to a hopefully more stable one)
    const proxyUrl = "https://corsproxy.io/?";
    const response = await axios.get(`${proxyUrl}${encodeURIComponent(url)}`, {
      timeout: 5000,
    });

    if (!response.data) return null;

    const html =
      typeof response.data === "string"
        ? response.data
        : JSON.stringify(response.data);
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Extract Open Graph tags
    const getMeta = (property: string) => {
      const el = doc.querySelector(
        `meta[property="${property}"], meta[name="${property}"]`,
      );
      return el ? el.getAttribute("content") : null;
    };

    const ogTitle = getMeta("og:title") || doc.title;
    const ogDescription = getMeta("og:description") || getMeta("description");
    const ogImage = getMeta("og:image");
    const ogType = getMeta("og:type");

    if (!ogTitle) return null;

    // Infer type
    let type: Item["type"] = "other";
    if (
      url.includes("imdb.com") ||
      url.includes("netflix.com") ||
      ogType?.includes("video.movie")
    ) {
      type = "movie";
    } else if (
      url.includes("steam") ||
      url.includes("rawg.io") ||
      ogType?.includes("game")
    ) {
      type = "game";
    } else if (url.includes("books.google") || ogType?.includes("book")) {
      type = "book";
    } else if (ogType?.includes("video.tv_show")) {
      type = "show";
    }

    return {
      title: ogTitle.replace(/ - IMDb| - Steam| - Netflix/gi, "").trim(),
      description: ogDescription?.substring(0, 500),
      image: ogImage || undefined,
      type,
      source: "manual", // Mark as manual add via link
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    logger.error("Link recognition failed", "linkRecognition", error);
    return null;
  }
};
