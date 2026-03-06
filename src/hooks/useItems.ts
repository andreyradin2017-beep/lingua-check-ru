import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import type { Category } from "../components/CategorySelector";
import { searchService } from "../services/searchService";

export type SortOption = "dateAdded" | "rating" | "releaseDate" | "title";

// Track if index has been initialized to prevent redundant re-indexing
let isIndexed = false;

export function useRecentItems(
  category: Category,
  sortBy: SortOption = "dateAdded",
) {
  return useLiveQuery(async () => {
    // Filter by category and archived status at DB level for better performance
    const all = await db.items
      .where("type")
      .equals(category)
      .filter((item) => !item.isArchived)
      .toArray();

    let sorted = all;

    // Apply sorting
    switch (sortBy) {
      case "dateAdded":
        sorted = [...all].sort((a, b) => (b.id || 0) - (a.id || 0));
        break;
      case "rating":
        sorted = [...all].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "releaseDate":
        sorted = [...all].sort((a, b) => {
          const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
          const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
          return dateB - dateA; // Newest first
        });
        break;
      case "title":
        sorted = [...all].sort((a, b) =>
          (a.title || "").localeCompare(b.title || ""),
        );
        break;
    }

    return sorted.slice(0, 50);
  }, [category, sortBy]);
}

export function useLibrarySearch(query: string, category: Category) {
  return useLiveQuery(async () => {
    const trimmedQuery = query.trim().toLowerCase();
    const all = await db.items.toArray();

    // 1. Ensure search index is up to date (only once per session)
    if (!isIndexed) {
      await searchService.indexAll(all);
      isIndexed = true;
    }

    // 2. Perform search
    if (!trimmedQuery) {
      // Fallback to simple filtering (show all) when query is empty
      return all
        .filter((item) => {
          const isUnarchived =
            (item as any).isArchived !== true && (item as any).isArchived !== 1;
          return item.type === category && isUnarchived;
        })
        .map((i) => ({ ...i, isOwned: true }));
    }

    // Use FlexSearch for actual queries
    const matchingIds = await searchService.search(trimmedQuery);

    return all
      .filter((item) => {
        const id = item.id;
        const isMatch = id !== undefined && matchingIds.includes(id);
        const isUnarchived =
          (item as any).isArchived !== true && (item as any).isArchived !== 1;

        return isMatch && item.type === category && isUnarchived;
      })
      .map((i) => ({ ...i, isOwned: true }));
  }, [query, category]);
}
