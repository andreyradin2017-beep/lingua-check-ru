import type { Item } from "../types";
import type { GoogleBooksResponse, GoogleBook } from "../types/api";
import { googleBooksClient } from "./apiClient";
import { logger } from "../utils/logger";

export const searchBooks = async (query: string): Promise<Item[] | null> => {
  // Prevent search with empty/undefined query
  if (!query || query.trim() === "") {
    return null;
  }

  try {
    const response = await googleBooksClient.get<GoogleBooksResponse>(
      "/volumes",
      {
        params: { q: query, maxResults: 20, langRestrict: "ru" },
      },
    );

    const data = response.data;
    if (!data?.items) return null;

    return data.items.map((book) => {
      const info = book.volumeInfo;
      return {
        title: info.title,
        type: "book" as const,
        status: "planned" as const,
        image: info.imageLinks?.thumbnail,
        description: info.description,
        year: info.publishedDate
          ? new Date(info.publishedDate).getFullYear()
          : undefined,
        source: "google_books" as const,
        externalId: book.id,
        authors: info.authors || [],
        tags: info.categories || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });
  } catch (error) {
    // Silently handle network errors - Google Books API may be unavailable
    console.warn("[Google Books] Search unavailable:", (error as Error).message);
    return null;
  }
};

export const getBookDetails = async (id: string): Promise<any> => {
  try {
    const response = await googleBooksClient.get<GoogleBook>(`/volumes/${id}`);
    const data = response.data;
    if (!data) return null;

    const info = data.volumeInfo;
    let related: Item[] = [];

    // Fetch author's other books for recommendations
    if (info.authors && info.authors.length > 0) {
      try {
        const authorQuery = `inauthor:"${info.authors[0]}"`;
        const authorBooks = await searchBooks(authorQuery);
        if (authorBooks) {
          // Filter out the current book
          related = authorBooks.filter((b) => b.externalId !== id).slice(0, 10);
        }
      } catch (err) {
        console.warn("Error fetching related books from Google Books", err);
      }
    }

    return {
      title: info.title,
      image: info.imageLinks?.thumbnail,
      description: info.description,
      authors: info.authors || [],
      genres: info.categories || [],
      related,
      providers: [],
      type: "book",

    };
  } catch (error) {
    logger.error("Google Books Details Error", "googleBooks", error);
    return null;
  }
};
