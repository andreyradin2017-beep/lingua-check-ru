import { describe, it, expect } from "vitest";
import { normalizeItem, fixLegacyImageUrl } from "../services/normalizer";
import type { Item } from "../types";

describe("Normalizer", () => {
  it("should fix missing type based on source", () => {
    const rawgItem = { title: "Game", source: "rawg" as const };
    const normalized = normalizeItem(rawgItem);
    expect(normalized.type).toBe("game");
  });

  it("should normalize legacy 'dropped' status to 'planned'", () => {
    const item = { title: "Test", status: "dropped" as any };
    const normalized = normalizeItem(item);
    expect(normalized.status).toBe("planned");
  });

  it("should proxy legacy TMDB image URLs", () => {
    const legacyUrl = "https://trakerevo.app/api/tmdb-image?path=/test.jpg";
    const fixed = fixLegacyImageUrl(legacyUrl);
    expect(fixed).toContain("wsrv.nl");
    expect(fixed).toContain("image.tmdb.org");
    expect(fixed).toBeDefined();
    expect(decodeURIComponent(fixed!)).toContain("image.tmdb.org/t/p/test.jpg");
  });

  it("should keep valid status and type", () => {
    const item: Partial<Item> = { title: "Good", type: "book", status: "completed" };
    const normalized = normalizeItem(item);
    expect(normalized.type).toBe("book");
    expect(normalized.status).toBe("completed");
  });

  it("should provide default dates if missing", () => {
    const item = { title: "Date test" };
    const normalized = normalizeItem(item);
    expect(normalized.createdAt).toBeInstanceOf(Date);
    expect(normalized.updatedAt).toBeInstanceOf(Date);
  });
});
