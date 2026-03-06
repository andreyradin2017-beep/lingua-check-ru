import axios from "axios";
import type { Item } from "../types";

const LITRES_SEARCH_URL = "/api/litres/search";
const LITRES_DETAILS_URL = "/api/litres/arts/";
const CDN_BASE = "https://cdn.litres.ru";

export const searchLitres = async (query: string): Promise<Item[]> => {
  try {
    const response = await axios.get(LITRES_SEARCH_URL, {
      params: {
        q: query,
        limit: 10,
        types: "text_book", // text_book, audiobook
      },
    });

    const items = response.data?.payload?.data || [];
    
    return items
      .map((item: any) => {
        const art = item.instance;
        if (!art) return null;

        const authors = art.persons
          ?.filter((p: any) => p.role === "author")
          .map((p: any) => p.full_name) || [];

        return {
          externalId: String(art.id),
          source: "litres" as const,
          type: "book" as const,
          title: art.title,
          description: art.annotation || "",
          image: art.cover_url ? `${CDN_BASE}${art.cover_url}` : "",
          releaseDate: art.date_written || art.year || "",
          rating: art.rating?.rated_avg || 0,
          authors: authors,
          tags: [],
          status: "planned" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      })
      .filter((i: any) => i !== null);
  } catch (error) {
    console.error("Litres search failed:", error);
    return [];
  }
};

export const getLitresDetails = async (id: string): Promise<any> => {
  // Strip 'litres-' prefix if present (can happen from URL params)
  const cleanId = id.replace(/^litres-/, "");
  try {
    const response = await axios.get(`${LITRES_DETAILS_URL}${cleanId}`);
    const art = response.data?.payload?.data;
    if (!art) return null;

    const authors = art.persons
      ?.filter((p: any) => p.role === "author")
      .map((p: any) => p.full_name) || [];

    let related: Item[] = [];

    // Fetch author's other books for recommendations
    if (authors && authors.length > 0) {
      try {
        const authorBooks = await searchLitres(authors[0]);
        if (authorBooks) {
          // Filter out the current book
          related = authorBooks.filter((b) => b.externalId !== cleanId).slice(0, 10);
        }
      } catch (err) {
        console.warn("Error fetching related books from LitRes", err);
      }
    }

    return {
      title: art.title,
      description: art.annotation || "",
      posterUrl: art.cover_url ? `${CDN_BASE}${art.cover_url}` : "",
      authors: authors,
      author: authors.join(", "),
      genres: art.genres?.map((g: any) => g.name) || [],
      rating: art.rating?.rated_avg,
      publisher: art.publisher?.name,
      url: `https://www.litres.ru${art.url}`,
      related,
    };

  } catch (error) {
    console.error("Litres details failed:", error);
    return null;
  }
};
