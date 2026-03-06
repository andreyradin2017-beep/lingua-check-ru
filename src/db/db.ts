import Dexie, { type EntityTable } from "dexie";
import type { Item, List, Settings, SearchProvider } from "../types";

const db = new Dexie("TrakerEvoDB") as Dexie & {
  items: EntityTable<Item, "id">;
  lists: EntityTable<List, "id">;
  settings: EntityTable<Settings, "key">;
  cache: EntityTable<{ key: string; data: any; timestamp: number }, "key">;
  search_history: EntityTable<{ query: string; timestamp: number }, "query">;
  deleted_metadata: EntityTable<
    { id: string; table: "items" | "lists"; timestamp: number },
    "id"
  >;
  search_providers: EntityTable<SearchProvider, "id">;
};

db.version(12).stores({
  items:
    "++id, type, status, isArchived, *tags, listId, createdAt, externalId, source, [externalId+source], supabaseId",
  lists: "++id, name, supabaseId",
  settings: "key",
  cache: "key, timestamp",
  search_history: "query, timestamp",
  deleted_metadata: "id, table, timestamp",
  search_providers: "id, enabled, priority",
});

export { db };
