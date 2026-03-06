import { Document } from "flexsearch";
import type { Item } from "../types";
import { db } from "../db/db";

// Index configuration
// We use 'Document' for multi-field indexing (title, description, tags)
const index = new Document({
  document: {
    id: "id",
    index: ["title", "description", "original_title", "tags"],
    store: true, // We store the whole object for easy retrieval, or just IDs
  },
  tokenize: "full", // Good for suffix/prefix matching
  cache: true,
  context: true,
});

let isIndexed = false;

export const searchService = {
  /**
   * Bulk index items from the database
   */
  async indexAll(items: Item[]) {
    items.forEach((item) => {
      if (item.id) {
        index.add({
          id: item.id,
          title: item.title,
          description: item.description || "",
          original_title: (item as any).original_title || "",
          tags: (item.tags || []).join(" "),
        });
      }
    });
    isIndexed = true;
  },

  /**
   * Add or update a single item in the index
   */
  async upsertItem(item: Item) {
    if (item.id) {
      index.add({
        id: item.id,
        title: item.title,
        description: item.description || "",
        original_title: (item as any).original_title || "",
        tags: (item.tags || []).join(" "),
      });
    }
  },

  /**
   * Remove an item from the index
   */
  async removeItem(id: number) {
    index.remove(id);
  },

  /**
   * Perform a fuzzy search
   */
  async search(query: string): Promise<number[]> {
    if (!query.trim()) return [];

    const rawResults = await index.search(query, {
      limit: 50,
      suggest: true,
    });

    const allIds = new Set<number>();
    rawResults.forEach((fieldResult: any) => {
      fieldResult.result.forEach((id: number) => allIds.add(id));
    });

    return Array.from(allIds);
  },

  isReady() {
    return isIndexed;
  },
};

// Auto-indexing via Dexie hooks
db.items.hook("creating", (_pk, obj) => {
  searchService.upsertItem(obj);
});

db.items.hook("updating", (mods, _pk, obj) => {
  searchService.upsertItem({ ...obj, ...mods });
});

db.items.hook("deleting", (pk) => {
  searchService.removeItem(pk as number);
});
