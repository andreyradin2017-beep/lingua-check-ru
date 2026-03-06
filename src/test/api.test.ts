import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchAll } from "../services/api";
import { db } from "../db/db";

// Mock providers
vi.mock("../services/tmdb", () => ({
  searchMovies: vi.fn().mockResolvedValue([
    {
      title: "Movie 1",
      source: "tmdb",
      externalId: "1",
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
}));
vi.mock("../services/rawg", () => ({
  searchGames: vi.fn().mockResolvedValue([
    {
      title: "Game 1",
      source: "rawg",
      externalId: "2",
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
}));
vi.mock("../services/googleBooks", () => ({
  searchBooks: vi.fn().mockResolvedValue([]),
}));

// Mock DB
vi.mock("../db/db", () => ({
  db: {
    cache: {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    },
    search_providers: {
      toArray: vi.fn().mockResolvedValue([
        { id: "tmdb", enabled: true },
        { id: "rawg", enabled: true },
        { id: "google_books", enabled: false },
      ]),
    },
  },
}));

describe("ApiService - searchAll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return cached results if available and not expired", async () => {
    const mockCache = [{ title: "Cached Movie" }];
    (db.cache.get as any).mockResolvedValue({
      data: mockCache,
      timestamp: Date.now(),
    });

    const results = await searchAll("test");

    expect(results).toEqual(mockCache);
    expect(db.search_providers.toArray).not.toHaveBeenCalled();
  });

  it("should aggregate results from enabled providers and cache them", async () => {
    (db.cache.get as any).mockResolvedValue(null);

    const results = await searchAll("test");

    expect(results.length).toBe(2);
    expect(results.find((r) => r.source === "tmdb")).toBeDefined();
    expect(results.find((r) => r.source === "rawg")).toBeDefined();
    expect(db.cache.put).toHaveBeenCalled();
  });

  it("should exclude results from disabled providers", async () => {
    (db.cache.get as any).mockResolvedValue(null);
    (db.search_providers.toArray as any).mockResolvedValue([
      { id: "tmdb", enabled: true },
      { id: "rawg", enabled: false },
    ]);

    const results = await searchAll("test");

    expect(results.length).toBe(1);
    expect(results[0].source).toBe("tmdb");
  });
});
