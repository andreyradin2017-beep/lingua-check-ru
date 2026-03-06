import { db } from "../db/db";
import { supabase } from "./supabase";
import type { Item, List } from "../types";
import type { RemoteItem, RemoteList } from "../types/supabase";
import type { SyncResult } from "../types/sync";
import { logger } from "../utils/logger";

const CONTEXT = "dbSync";

// Migrate local items with 'dropped' status to 'planned'
export const migrateDroppedStatus = async (): Promise<void> => {
  try {
    const droppedItems = await db.items.filter((item) => item.status === ("dropped" as any)).toArray();
    if (droppedItems.length > 0) {
      const updates = droppedItems.map((item) =>
        db.items.update(item.id!, { status: "planned", updatedAt: new Date() })
      );
      await Promise.all(updates);
      logger.info(`Migrated ${droppedItems.length} items from 'dropped' to 'planned'`, CONTEXT);
    }
  } catch (error) {
    logger.error("Failed to migrate dropped status", CONTEXT, error);
  }
};

// Cleanup old cache entries (older than 30 days)
export const cleanupOldCache = async (): Promise<number> => {
  const CACHE_TTL = Number(import.meta.env.VITE_CACHE_TTL) || 30 * 24 * 60 * 60 * 1000;
  const allCache = await db.cache.toArray();
  const oldKeys = allCache
    .filter((entry) => Date.now() - entry.timestamp > CACHE_TTL)
    .map((entry) => entry.key);

  if (oldKeys.length > 0) {
    await db.cache.bulkDelete(oldKeys);
    logger.info(`Cleaned up ${oldKeys.length} old cache entries`, CONTEXT);
  }

  return oldKeys.length;
};

/**
 * Runs all maintenance tasks: status migration, cache cleanup, and structural normalization.
 */
export const ensureDataConsistency = async (): Promise<void> => {
  logger.info("Running data consistency checks...", CONTEXT);
  
  await db.transaction("rw", [db.items, db.cache], async () => {
    // 1. Migrate statuses
    await migrateDroppedStatus();
    
    // 2. Cleanup cache
    await cleanupOldCache();
    
    // 3. Normalize all items
    const items = await db.items.toArray();
    for (const item of items) {
      const normalized = normalizeItem(item);
      
      // Check if update is needed
      const needsUpdate = 
        !item.type || 
        normalized.type !== item.type || 
        normalized.status !== item.status || 
        normalized.image !== item.image;
        
      if (needsUpdate) {
        await db.items.update(item.id!, {
          ...normalized,
          updatedAt: new Date()
        });
      }
    }
  });
  
  logger.info("Data consistency check complete.", CONTEXT);
};

// Helper to map Local List -> Remote List
const toRemoteList = (list: List, userId: string): RemoteList => {
  return {
    id: list.supabaseId,
    user_id: userId,
    name: list.name,
    icon: list.icon,
    description: list.description,
    created_at: list.createdAt.toISOString(),
    updated_at: list.updatedAt
      ? list.updatedAt.toISOString()
      : new Date().toISOString(),
    local_id: list.id,
  };
};

// Helper to map Remote List -> Local List
const toLocalList = (remote: RemoteList): List => {
  return {
    id: remote.local_id || undefined,
    supabaseId: remote.id,
    name: remote.name,
    icon: remote.icon,
    description: remote.description,
    createdAt: new Date(remote.created_at),
    updatedAt: new Date(remote.updated_at),
  };
};

import { normalizeItem } from "./normalizer";

// Helper to map Local Item -> Remote Item
const toRemoteItem = async (
  item: Item,
  userId: string,
): Promise<RemoteItem | null> => {
  const normalized = normalizeItem(item);
  
  if (!normalized.title || !normalized.type) {
    logger.warn(`Skipping item with missing required fields: ${JSON.stringify(item)}`, CONTEXT);
    return null;
  }

  let listUuid: string | undefined = undefined;
  if (item.listId) {
    const list = await db.lists.get(item.listId);
    if (list && list.supabaseId) {
      listUuid = list.supabaseId;
    }
  }

  return {
    id: item.supabaseId,
    user_id: userId,
    title: normalized.title,
    type: normalized.type,
    status: normalized.status,
    image: normalized.image,
    description: normalized.description,
    year: normalized.year,
    rating: normalized.rating,
    progress: normalized.progress,
    total_progress: normalized.totalProgress,
    current_season: normalized.currentSeason,
    current_episode: normalized.currentEpisode,
    episodes_per_season: normalized.episodesPerSeason,
    is_archived: normalized.isArchived,
    trailer_url: normalized.trailerUrl,
    watch_providers: normalized.watchProviders,
    related_external_ids: normalized.relatedExternalIds,
    notes: normalized.notes,
    tags: normalized.tags,
    external_id: normalized.externalId,
    source: normalized.source,
    created_at: normalized.createdAt.toISOString(),
    updated_at: normalized.updatedAt.toISOString(),
    list_id: listUuid,
    local_id: normalized.id,
  };
};

// Helper to map Remote Item -> Local Item
const toLocalItem = async (remote: RemoteItem): Promise<Item> => {
  let localListId: number | undefined = undefined;
  if (remote.list_id) {
    const list = await db.lists
      .where("supabaseId")
      .equals(remote.list_id)
      .first();
    if (list) {
      localListId = list.id;
    }
  }

  return normalizeItem({
    id: remote.local_id || undefined,
    supabaseId: remote.id,
    title: remote.title,
    type: remote.type as Item["type"],
    status: remote.status as Item["status"],
    image: remote.image,
    description: remote.description,
    year: remote.year,
    rating: remote.rating,
    progress: remote.progress,
    totalProgress: remote.total_progress,
    currentSeason: remote.current_season,
    currentEpisode: remote.current_episode,
    episodesPerSeason: remote.episodes_per_season,
    isArchived: remote.is_archived,
    trailerUrl: remote.trailer_url,
    watchProviders: remote.watch_providers,
    relatedExternalIds: remote.related_external_ids,
    notes: remote.notes,
    tags: remote.tags || [],
    externalId: remote.external_id,
    source: remote.source as Item["source"],
    createdAt: new Date(remote.created_at),
    updatedAt: new Date(remote.updated_at),
    listId: localListId,
  });
};

export const syncDeletions = async (userId: string): Promise<number> => {
  const deletions = await db.deleted_metadata.toArray();
  let count = 0;
  for (const del of deletions) {
    const { error } = await supabase
      .from(del.table)
      .delete()
      .eq("id", del.id)
      .eq("user_id", userId);

    if (!error) {
      await db.deleted_metadata.delete(del.id);
      count++;
    } else {
      logger.error(
        `Failed to push deletion for ${del.table}:${del.id}`,
        CONTEXT,
        error,
      );
    }
  }
  return count;
};

export const syncLists = async (userId: string): Promise<number> => {
  // 0. PUSH DELETIONS - handled by syncAll or here if needed
  // await syncDeletions(userId);

  const localLists = await db.lists.toArray();
  let processed = 0;

  for (const list of localLists) {
    if (!list.supabaseId) {
      const { data, error } = await supabase
        .from("lists")
        .insert(toRemoteList(list, userId))
        .select()
        .single();

      if (!error && data) {
        await db.lists.update(list.id!, { supabaseId: data.id });
        processed++;
      }
    } else {
      const { error } = await supabase
        .from("lists")
        .update(toRemoteList(list, userId))
        .eq("id", list.supabaseId);
      if (!error) processed++;
      else logger.error(`Error updating list ${list.name}`, CONTEXT, error);
    }
  }

  const { data: remoteLists, error } = await supabase.from("lists").select("*");
  if (error || !remoteLists) {
    if (error) throw error;
    return processed;
  }

  for (const remote of remoteLists as RemoteList[]) {
    const local = localLists.find((l) => l.supabaseId === remote.id);

    if (!local) {
      await db.lists.put(toLocalList(remote));
      processed++;
    } else {
      const remoteTime = new Date(remote.updated_at).getTime();
      const localTime = local.updatedAt ? local.updatedAt.getTime() : 0;

      if (remoteTime > localTime) {
        const mapped = toLocalList(remote);
        mapped.id = local.id;
        await db.lists.put(mapped);
        processed++;
      }
    }
  }

  for (const local of localLists) {
    if (
      local.supabaseId &&
      !remoteLists.some((r) => r.id === local.supabaseId)
    ) {
      await db.lists.delete(local.id!);
      processed++;
    }
  }
  return processed;
};

export const syncItems = async (userId: string): Promise<number> => {
  const localItems = await db.items.toArray();
  let processed = 0;

  for (const item of localItems) {
    const payload = await toRemoteItem(item, userId);

    // Skip invalid items
    if (!payload) {
      logger.warn(`Skipping sync for invalid item: ${item.id}`, CONTEXT);
      continue;
    }

    if (!item.supabaseId) {
      const { data, error } = await supabase
        .from("items")
        .insert(payload)
        .select()
        .single();
      if (!error && data) {
        await db.items.update(item.id!, { supabaseId: data.id });
        processed++;
      } else {
        logger.error(`Failed to push item ${item.title}`, CONTEXT, error);
      }
    } else {
      const { error } = await supabase
        .from("items")
        .update(payload)
        .eq("id", item.supabaseId);
      if (!error) processed++;
      else logger.error(`Failed to update item ${item.title}`, CONTEXT, error);
    }
  }

  const { data: remoteItems, error } = await supabase.from("items").select("*");
  if (error || !remoteItems) {
    if (error) throw error;
    return processed;
  }

  for (const remote of remoteItems as RemoteItem[]) {
    const local = localItems.find((i) => i.supabaseId === remote.id);
    const mapped = await toLocalItem(remote);

    if (!local) {
      await db.items.put(mapped);
      processed++;
    } else {
      const remoteTime = new Date(remote.updated_at).getTime();
      const localTime = local.updatedAt.getTime();

      if (remoteTime > localTime) {
        mapped.id = local.id;
        await db.items.put(mapped);
        processed++;
      }
    }
  }

  for (const local of localItems) {
    if (
      local.supabaseId &&
      !remoteItems.some((r) => r.id === local.supabaseId)
    ) {
      await db.items.delete(local.id!);
      processed++;
    }
  }
  return processed;
};

export const syncAll = async (): Promise<SyncResult> => {
  const result: SyncResult = {
    success: true,
    timestamp: new Date(),
    processedCount: { lists: 0, items: 0, deletions: 0 },
    errors: [],
  };

  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError || !session?.user) {
    result.success = false;
    result.errors.push({
      context: "auth",
      message: "Пользователь не авторизован",
      originalError: authError,
    });
    return result;
  }

  const userId = session.user.id;

  try {
    logger.info("Starting Sync...", CONTEXT);

    try {
      result.processedCount.deletions = await syncDeletions(userId);
    } catch (err) {
      result.errors.push({
        context: "deletions",
        message: "Ошибка удаления",
        originalError: err,
      });
    }

    try {
      result.processedCount.lists = await syncLists(userId);
    } catch (err) {
      result.errors.push({
        context: "lists",
        message: "Ошибка списков",
        originalError: err,
      });
    }

    try {
      result.processedCount.items = await syncItems(userId);
    } catch (err) {
      result.errors.push({
        context: "items",
        message: "Ошибка элементов",
        originalError: err,
      });
    }

    // 4. Cache Cleanup
    try {
      const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days for sync cleanup
      const now = Date.now();
      await db.cache
        .where("timestamp")
        .below(now - CACHE_TTL)
        .delete();
    } catch (err) {
      logger.warn("Cache cleanup failed", CONTEXT, err);
    }

    result.success = result.errors.length === 0;
    logger.info("Sync Completed", CONTEXT, result.processedCount);
    return result;
  } catch (error) {
    logger.error("Critical Sync Error", CONTEXT, error);
    result.success = false;
    result.errors.push({
      context: "auth",
      message: "Критическая ошибка синхронизации",
      originalError: error,
    });
    return result;
  }
};

// --- MIGRATION LOGIC ---

/**
 * Migrates data from local guest state to user's remote state.
 * @param userId - Supabase user ID
 * @param mode - 'merge' (deduplicate & sync) or 'replace' (start fresh with remote data)
 */
export const migrateGuestData = async (
  userId: string,
  mode: "merge" | "replace",
) => {
  // First, normalize all items BEFORE syncing using a transaction
  await db.transaction("rw", db.items, async () => {
    const allLocalItems = await db.items.toArray();
    for (const item of allLocalItems) {
      const normalized = normalizeItem(item);
      // Update if any change detected (structural check or just updatedAt)
      if (
        normalized.type !== item.type ||
        normalized.status !== item.status ||
        normalized.image !== item.image ||
        !item.type
      ) {
        await db.items.update(item.id!, {
          ...normalized,
          updatedAt: new Date(),
        });
      }
    }
  });
  
  logger.info("Local data normalized via transaction", CONTEXT);

  if (mode === "replace") {
    await Promise.all([
      db.items.clear(),
      db.lists.clear(),
      db.deleted_metadata.clear(),
    ]);
    return syncAll();
  }

  // Reload items after normalization to ensure current state for merge loop
  const allLocalItems = await db.items.toArray();

  // --- MERGE MODE: Smart deduplication ---

  // 1. Sync Lists first
  const localLists = await db.lists.toArray();
  const { data: remoteLists } = await supabase
    .from("lists")
    .select("*")
    .eq("user_id", userId);

  for (const local of localLists) {
    if (local.supabaseId) continue;

    const match = remoteLists?.find((r) => r.name === local.name);
    if (match) {
      await db.lists.update(local.id!, { supabaseId: match.id });
    } else {
      const { data, error } = await supabase
        .from("lists")
        .insert(toRemoteList(local, userId))
        .select()
        .single();
      if (!error && data) {
        await db.lists.update(local.id!, { supabaseId: data.id });
      }
    }
  }

  // 2. Sync Items with deduplication
  const { data: remoteItems } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", userId);

  let syncedCount = 0;
  let skippedCount = 0;

  for (const local of allLocalItems) {
    if (local.supabaseId) {
      syncedCount++;
      continue;
    }

    const match = remoteItems?.find(
      (r) => r.external_id === local.externalId && r.source === local.source,
    );

    if (match) {
      await db.items.update(local.id!, { supabaseId: match.id });
      syncedCount++;
    } else {
      const payload = await toRemoteItem(local, userId);
      if (!payload) {
        logger.warn(`Skipping push for invalid item ${local.id}: missing type or title`, CONTEXT);
        skippedCount++;
        continue;
      }
      const { data, error } = await supabase
        .from("items")
        .insert(payload)
        .select()
        .single();
      if (!error && data) {
        await db.items.update(local.id!, { supabaseId: data.id });
        syncedCount++;
      } else {
        logger.error(`Failed to sync item ${local.id}: ${error?.message}`, CONTEXT, error);
        skippedCount++;
      }
    }
  }

  logger.info(`Synced: ${syncedCount}, Skipped: ${skippedCount}`, CONTEXT);

  return syncAll();
};

// --- AUTO-SYNC LOGIC ---
let syncTimeout: any = null;

export const triggerAutoSync = () => {
  if (!navigator.onLine) return;

  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    logger.info("Triggering auto-sync...", "dbSync");
    await syncAll();
  }, 5000); // 5 second debounce
};
