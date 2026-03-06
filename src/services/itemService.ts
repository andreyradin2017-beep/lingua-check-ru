import { db } from "../db/db";
import type { Item } from "../types";
import { triggerAutoSync } from "./dbSync";

export interface BulkAddResult {
  added: number;
  skipped: number;
  newIds: number[];
}

/**
 * Optimized bulk addition of items with duplicate checking.
 */
export const bulkAddPlannedItems = async (
  items: Item[],
): Promise<BulkAddResult> => {
  if (items.length === 0) {
    return { added: 0, skipped: 0, newIds: [] };
  }

  // 1. Get all externalIds and sources to check for duplicates in one go
  const externalIdPairs = items
    .filter((i) => i.externalId && i.source)
    .map((i) => [i.externalId, i.source] as [string, string]);

  // Dexie can query multiple keys at once
  const existingItems = await db.items
    .where("[externalId+source]")
    .anyOf(externalIdPairs)
    .toArray();

  const existingMap = new Set(
    existingItems.map((i) => `${i.externalId}|${i.source}`),
  );

  // 2. Filter out items that are already in the library
  const toAdd = items.filter((item) => {
    const key = `${item.externalId}|${item.source}`;
    return !existingMap.has(key);
  });

  if (toAdd.length === 0) {
    return { added: 0, skipped: items.length, newIds: [] };
  }

  // 3. Prepare items for insertion
  const itemsToInsert: Item[] = toAdd.map((item) => ({
    ...item,
    status: "planned",
    tags: item.tags || [],
    createdAt: new Date(),
    updatedAt: new Date(),
    isArchived: false,
  }));

  // 4. Perform bulk add
  const ids = await db.items.bulkAdd(itemsToInsert, { allKeys: true });

  // 5. Trigger sync
  triggerAutoSync();

  return {
    added: itemsToInsert.length,
    skipped: items.length - itemsToInsert.length,
    newIds: ids as number[],
  };
};
