import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDiscoverData } from "../services/discover";
import { db } from "../db/db";
import { tmdbClient, rawgClient } from "../services/apiClient";

vi.mock("../services/apiClient", () => ({
  tmdbClient: { get: vi.fn() },
  rawgClient: { get: vi.fn() },
}));

// Mock DB
vi.mock("../db/db", () => ({
  db: {
    cache: {
      get: vi.fn(),
      put: vi.fn(),
    },
    settings: {
      get: vi.fn().mockResolvedValue({ value: "test-key" }),
    },
  },
}));

describe("DiscoverService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return cached discover data if valid", async () => {
    const mockData = {
      trending: [],
      upcoming: [],
      newGames: [],
      upcomingGames: [],
    };
    (db.cache.get as any).mockResolvedValue({
      data: mockData,
      timestamp: Date.now(),
    });

    const data = await getDiscoverData();

    expect(data).toEqual(mockData);
    expect(tmdbClient.get).not.toHaveBeenCalled();
    expect(rawgClient.get).not.toHaveBeenCalled();
  });

  it("should fetch and transform data from TMDB and RAWG if cache is empty", async () => {
    (db.cache.get as any).mockResolvedValue(null);

    vi.mocked(tmdbClient.get).mockResolvedValue({
      data: {
        results: [
          {
            id: 1,
            title: "Movie 1",
            media_type: "movie",
            poster_path: "/path.jpg",
          },
        ],
      },
    } as any);

    vi.mocked(rawgClient.get).mockResolvedValue({
      data: {
        results: [
          {
            id: 101,
            name: "Game 1",
            background_image: "game.jpg",
            released: "2024-01-01",
          },
        ],
      },
    } as any);

    const data = await getDiscoverData();

    expect(data.trending.length).toBe(1);
    expect(data.trending[0].title).toBe("Movie 1");
    expect(data.trending[0].source).toBe("tmdb");

    expect(data.newGames.length).toBe(1);
    expect(data.newGames[0].title).toBe("Game 1");
    expect(data.newGames[0].type).toBe("game");

    expect(db.cache.put).toHaveBeenCalled();
  });
});
