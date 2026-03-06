import { describe, it, expect, vi, beforeEach } from "vitest";
import { migrateGuestData, syncAll } from "../services/dbSync";
import { db } from "../db/db";
import { supabase } from "../services/supabase";

// Setup robust Supabase mock
const createSupabaseMock = () => {
  const mock = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi
      .fn()
      .mockImplementation(() => Promise.resolve({ data: {}, error: null })),
    then: vi.fn().mockImplementation((onFulfilled) => {
      return Promise.resolve({ data: [], error: null }).then(onFulfilled);
    }),
  };
  return mock;
};

vi.mock("../services/supabase", () => ({
  supabase: {
    from: vi.fn(() => createSupabaseMock()),
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
      }),
    },
  },
}));

// Mock db
vi.mock("../db/db", () => ({
  db: {
    items: {
      clear: vi.fn().mockResolvedValue(undefined),
      toArray: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue(1),
      count: vi.fn().mockResolvedValue(0),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    lists: {
      clear: vi.fn().mockResolvedValue(undefined),
      toArray: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue(1),
      count: vi.fn().mockResolvedValue(0),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    deleted_metadata: {
      clear: vi.fn().mockResolvedValue(undefined),
      toArray: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    cache: {
      where: vi.fn().mockReturnThis(),
      below: vi.fn().mockReturnThis(),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    search_providers: {
      id: "rawg",
      enabled: true,
      priority: 1,
    },
    transaction: vi.fn(async (_mode, _tables, callback) => {
      // @ts-ignore
      await callback();
    }),
  },
}));

// We can't easily mock internal calls to syncAll in the same file.
// We'll verify side effects instead.

describe("migrateGuestData", () => {
  const userId = "test-user-id";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should clear database and sync in replace mode", async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { user: { id: userId } } },
    });
    await migrateGuestData(userId, "replace");

    expect(db.items.clear).toHaveBeenCalled();
    expect(db.lists.clear).toHaveBeenCalled();
  });

  it("should merge lists by name and deduplicate items by externalId", async () => {
    // 1. Setup mocks for lists
    const now = new Date();
    const localList = {
      id: 1,
      name: "Favorite",
      supabaseId: undefined,
      createdAt: now,
      updatedAt: now,
      icon: "heart",
      description: "",
    };
    const remoteList = { id: "remote-list-1", name: "Favorite" };

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { user: { id: userId } } },
    });
    (db.lists.toArray as any).mockResolvedValue([localList]);
    (supabase.from as any).mockImplementation(() => {
      const m = createSupabaseMock();
      m.eq = vi.fn().mockResolvedValue({ data: [remoteList] });
      return m;
    });

    // 2. Setup mocks for items
    const localItem = {
      id: 101,
      title: "Movie",
      externalId: "ext-1",
      source: "yandex",
      supabaseId: undefined,
      createdAt: now,
      updatedAt: now,
    };
    const remoteItem = {
      id: "remote-item-1",
      external_id: "ext-1",
      source: "yandex",
    };

    (db.items.toArray as any).mockResolvedValue([localItem]);
    // Configure next call to from('items')
    (supabase.from as any).mockImplementation((table: string) => {
      const m = createSupabaseMock();
      if (table === "lists") {
        m.eq = vi.fn().mockResolvedValue({ data: [remoteList] });
      } else if (table === "items") {
        m.eq = vi.fn().mockResolvedValue({ data: [remoteItem] });
      }
      return m;
    });

    await migrateGuestData(userId, "merge");

    // 3. Assertions
    // List should be linked to existing remote list
    expect(db.lists.update).toHaveBeenCalledWith(1, {
      supabaseId: "remote-list-1",
    });

    // Item should be linked to existing remote item (deduplication)
    expect(db.items.update).toHaveBeenCalledWith(101, {
      supabaseId: "remote-item-1",
    });

    // Item should be linked to existing remote item (deduplication)
    expect(db.items.update).toHaveBeenCalledWith(101, {
      supabaseId: "remote-item-1",
    });
  });

  it("should create new remote list if no match found during merge", async () => {
    const now = new Date();
    const localList = {
      id: 1,
      name: "New List",
      supabaseId: undefined,
      createdAt: now,
      updatedAt: now,
      icon: "star",
      description: "",
    };
    (db.lists.toArray as any).mockResolvedValue([localList]);
    (db.items.toArray as any).mockResolvedValue([]);

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { user: { id: userId } } },
    });

    // Mock supabase to return no matches and then handle insert
    const insertMock = vi
      .fn()
      .mockResolvedValue({ data: { id: "new-remote-id" }, error: null });

    (supabase.from as any).mockImplementation(() => {
      const m = createSupabaseMock();
      m.eq = vi.fn().mockResolvedValue({ data: [] }); // No matches
      m.single = insertMock;
      return m;
    });

    await migrateGuestData(userId, "merge");

    expect(db.lists.update).toHaveBeenCalledWith(1, {
      supabaseId: "new-remote-id",
    });
  });
});

describe("syncAll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error result if user is not authenticated", async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const result = await syncAll();

    expect(result.success).toBe(false);
    expect(result.errors[0].context).toBe("auth");
  });

  it("should return success and processed counts on successful sync", async () => {
    const userId = "test-user-id";
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { user: { id: userId } } },
      error: null,
    });

    // Mock deletions
    (db.deleted_metadata.toArray as any).mockResolvedValue([
      { id: "1", table: "items" },
    ]);
    (supabase.from as any).mockImplementation(() => {
      const m = createSupabaseMock();
      m.delete = vi.fn().mockReturnThis();
      m.eq = vi.fn().mockReturnThis();
      m.then = vi.fn().mockImplementation((cb) => cb({ error: null }));
      return m;
    });

    // Mock lists/items to be empty for simple success
    (db.lists.toArray as any).mockResolvedValue([]);
    (db.items.toArray as any).mockResolvedValue([]);

    const result = await syncAll();

    expect(result.success).toBe(true);
    expect(result.processedCount).toBeDefined();
    // It should have called syncDeletions which clears one
    expect(db.deleted_metadata.delete).toHaveBeenCalled();
  });

  it("should capture errors during different phases", async () => {
    const userId = "test-user-id";
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { user: { id: userId } } },
      error: null,
    });

    // Make syncLists throw
    (db.lists.toArray as any).mockImplementation(() => {
      throw new Error("Dexie Error");
    });

    const result = await syncAll();

    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.context === "lists")).toBe(true);
    // Even if lists fail, syncItems should have been called (verified by coverage/logic)
    // and we expect result.processedCount to reflect what did happen (0 in this case)
    expect(result.processedCount.lists).toBe(0);
  });
});
