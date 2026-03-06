import React, { useState, useEffect } from "react";
import {
  Search as SearchIcon,
  Library,
  Globe,
  X,
  History,
  Trash2,
  Plus,
} from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getTrending, searchByCategory } from "@services/api";
import { searchKinopoisk } from "@services/kinopoisk";
import { searchMovies } from "@services/tmdb";
import { searchGames } from "@services/rawg";
import { searchBooks } from "@services/googleBooks";
import { useLiveQuery } from "dexie-react-hooks";
import type { Item } from "@types";
import { db } from "@db/db";
import { GridCard } from "@components/GridCard";
import { WideListItem } from "@components/WideListItem";
import { SkeletonCard } from "@components/SkeletonCard";
import { CategorySelector, type Category } from "@components/CategorySelector";
import { logger } from "@utils/logger";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

import { useLibrarySearch } from "@hooks/useItems";
import { triggerAutoSync } from "@services/dbSync";
import { useToast } from "@context/ToastContext";
import { PullToRefresh } from "@components/PullToRefresh";
import { vibrate } from "@utils/haptics";
import { bulkAddPlannedItems } from "@services/itemService";
import { recognizeMediaFromUrl } from "@services/linkRecognition";
import { motion } from "framer-motion";
import { useAutoAnimate } from "@formkit/auto-animate/react";

export const Search: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState("");
  const [lastQuery, setLastQuery] = useState(""); // Track last non-empty query
  const [lastCategory, setLastCategory] = useState<Category>("movie"); // Track last category
  const [globalResults, setGlobalResults] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [recognizedItem, setRecognizedItem] = useState<Item | null>(null);
  const [searchMode, setSearchMode] = useState<"global" | "library">("global");
  const [trendingSuggestions, setTrendingSuggestions] = useState<string[]>([]);
  useAutoAnimate();
  const { showToast } = useToast();

  const currentCategory = (searchParams.get("category") as Category) || "movie";

  // Fetch trending on mount or category change
  useEffect(() => {
    let cancelled = false;
    
    const fetchTrends = async () => {
      // Only for global mode and when no query
      if (searchMode === "global" && !query) {
        const trends = await getTrending(
          currentCategory as "movie" | "game" | "all",
        );
        if (!cancelled) {
          setTrendingSuggestions(trends);
        }
      }
    };
    
    fetchTrends();
    
    return () => {
      cancelled = true;
    };
  }, [currentCategory, searchMode, query]);

  // Hook handles all library search logic reactively
  const libraryResults = useLibrarySearch(query, currentCategory);

  // No filtering needed - search is already category-specific
  const filteredGlobalResults = globalResults;

  // Unified results based on active mode
  const results =
    searchMode === "library" ? libraryResults || [] : filteredGlobalResults;

  // Get search history from DB
  const searchHistory = useLiveQuery(
    () => db.search_history.reverse().limit(10).toArray(),
    [],
  );

  const searchCounter = React.useRef(0);

  const handleSearch = async (
    targetQuery: string = query,
    e?: React.FormEvent,
  ) => {
    if (e) e.preventDefault();
    const trimmedQuery = targetQuery.trim().toLowerCase();

    // Increment counter to track the latest request
    const currentCounter = ++searchCounter.current;

    // Library search is handled by the hook, so we only need to handle global search here
    if (searchMode === "library") return;

    if (!trimmedQuery) {
      setGlobalResults([]);
      setRecognizedItem(null);
      return;
    }

    // Clear source param when doing a new manual search
    if (searchParams.get("source")) {
      searchParams.delete("source");
      setSearchParams(searchParams, { replace: true });
    }

    setLoading(true);
    setRecognizedItem(null);

    // URL Detection
    if (trimmedQuery.startsWith("http")) {
      try {
        const item = await recognizeMediaFromUrl(trimmedQuery);
        if (item) {
          setRecognizedItem(item as Item);
          setLoading(false);
          return; // No need to perform global search for URL
        }
      } catch (e) {
        console.error("Link recognition error", e);
      }
    }
    try {
      setLoading(true);
      logger.debug("[Search] handleSearch triggered", "Search");

      const sourceParam = searchParams.get("source");
      let data: Item[] = [];

      // Search by specific source if provided
      if (sourceParam) {
        logger.debug("[Search] Searching by source: " + sourceParam, "Search");
        if (sourceParam === "kinopoisk") {
          data = (await searchKinopoisk(trimmedQuery)) || [];
        } else if (sourceParam === "tmdb") {
          data = (await searchMovies(trimmedQuery)) || [];
        } else if (sourceParam === "rawg") {
          data = (await searchGames(trimmedQuery)) || [];
        } else if (sourceParam === "google_books") {
          data = (await searchBooks(trimmedQuery)) || [];
        }
      } else {
        // Use the unified API orchestrator for category search
        data = await searchByCategory(trimmedQuery, currentCategory as any);
      }

      logger.debug("[Search] Results count: " + data.length, "Search");

      // Check which results are already in DB
      const externalIds = data
        .map((i) => i.externalId)
        .filter((id): id is string => !!id);

      const existingItems = await db.items
        .where("externalId")
        .anyOf(externalIds)
        .toArray();

      const existingMap = new Map();
      existingItems.forEach((item) => {
        if (item.externalId)
          existingMap.set(item.externalId + item.source, item);
      });

      const processedResults = data.map((item) => {
        const existing = existingMap.get(
          (item.externalId || "") + (item.source || ""),
        );
        if (existing) {
          return { ...item, ...existing, isOwned: true };
        }
        return item;
      });
      setGlobalResults((prev) => {
        // Only update if this is still the latest request
        if (currentCounter === searchCounter.current) {
          return processedResults;
        }
        return prev;
      });

      // Save to history if query is not empty
      if (trimmedQuery) {
        await db.search_history.put({
          query: trimmedQuery,
          timestamp: Date.now(),
        });
      }
    } catch (error: any) {
      logger.error("[Search] Search failed", "Search", error);
      showToast("Ошибка поиска. Проверьте интернет.", "error");

      // If we have partial results even with an error, show them
      if (error.partialResults && error.partialResults.length > 0) {
        logger.warn("[Search] Displaying partial results: " + error.partialResults.length, "Search");
        setGlobalResults(error.partialResults);
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-search when URL contains 'q' parameter (only on initial load)
  useEffect(() => {
    const queryParam = searchParams.get("q");
    const sourceParam = searchParams.get("source");

    // Don't override searchMode if user has already switched to library mode
    if (searchMode === "library") return;
    
    if (queryParam && queryParam.trim()) {
      setQuery(queryParam);
      setSearchMode("global");
      handleSearch(queryParam);
    } else if (sourceParam && queryParam) {
      // If source is specified, search even if query was already set
      setQuery(queryParam);
      setSearchMode("global");
      handleSearch(queryParam);
    }
  }, []); // Only run on mount, not on every searchParams change

  // Live Search (Debounced)
  useEffect(() => {
    if (searchMode === "library") return;
    
    // Update lastQuery and lastCategory when query/category changes
    if (query.trim()) {
      setLastQuery(query.trim());
    }
    setLastCategory(currentCategory);
    
    if (!query.trim()) {
      setGlobalResults([]);
      return;
    }

    const timer = setTimeout(() => {
      // Re-run search with current category
      const trimmedQuery = query.trim().toLowerCase();
      const sourceParam = searchParams.get("source");
      let data: Item[] = [];

      const performSearch = async () => {
        setLoading(true);
        try {
          if (sourceParam) {
            if (sourceParam === "kinopoisk") {
              data = (await searchKinopoisk(trimmedQuery)) || [];
            } else if (sourceParam === "tmdb") {
              data = (await searchMovies(trimmedQuery)) || [];
            } else if (sourceParam === "rawg") {
              data = (await searchGames(trimmedQuery)) || [];
            } else if (sourceParam === "google_books") {
              data = (await searchBooks(trimmedQuery)) || [];
            }
          } else {
            data = await searchByCategory(trimmedQuery, currentCategory as any);
          }

          // Check which results are already in DB
          const externalIds = data
            .map((i) => i.externalId)
            .filter((id): id is string => !!id);

          const existingItems = await db.items
            .where("externalId")
            .anyOf(externalIds)
            .toArray();

          const existingMap = new Map();
          existingItems.forEach((item) => {
            if (item.externalId)
              existingMap.set(item.externalId + item.source, item);
          });

          const processedResults = data.map((item) => {
            const existing = existingMap.get(
              (item.externalId || "") + (item.source || ""),
            );
            return existing ? { ...item, ...existing, isOwned: true } : item;
          });

          // Final deduplication by unique key
          const seenKeys = new Set<string>();
          const deduplicatedResults = processedResults.filter((item) => {
            const key = `${item.source || 'local'}-${item.externalId || item.id}`;
            if (seenKeys.has(key)) return false;
            seenKeys.add(key);
            return true;
          });

          // Also exclude recognizedItem from results to avoid duplicates
          const finalResults = recognizedItem && recognizedItem.externalId
            ? deduplicatedResults.filter(
                (item) => item.externalId !== recognizedItem.externalId || item.source !== recognizedItem.source
              )
            : deduplicatedResults;

          setGlobalResults(finalResults);
        } catch (error: any) {
          console.error("[Search] Search error:", error);
          setGlobalResults([]);
        } finally {
          setLoading(false);
        }
      };

      performSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [query, searchMode, currentCategory]);

  // Handle category change - re-run search with last query when switching categories
  useEffect(() => {
    if (searchMode === "library") return;
    if (!lastQuery.trim()) return;
    if (lastCategory === currentCategory) return; // Same category, no need to re-search
    
    // Only trigger search if we have a previous query and category changed
    setQuery(lastQuery);
  }, [currentCategory, lastCategory]);

  const inputRef = React.useRef<HTMLInputElement>(null);
  useEffect(() => {
    // Auto focus search on mount
    inputRef.current?.focus();
  }, []);

  const handleAdd = async (
    item: Item & { isOwned?: boolean },
    skipNavigation = false,
  ) => {
    if (item.isOwned && item.id) {
      navigate(`/item/${item.id}`);
      return;
    }

    const newItem = {
      ...item,
      status: "planned",
      tags: item.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Item;

    const id = await db.items.add(newItem);

    // Update global results state to show "Owned" immediately if we are in global mode
    if (searchMode === "global") {
      setGlobalResults((prev) =>
        prev.map((r) => {
          if (r.externalId === item.externalId && r.source === item.source) {
            return { ...r, ...newItem, id, isOwned: true };
          }
          return r;
        }),
      );
    }
    triggerAutoSync();

    if (skipNavigation) {
      showToast("Добавлено в планы", "success");
    }
  };

  const clearHistory = async () => {
    await db.search_history.clear();
  };

  const removeHistoryItem = async (q: string) => {
    await db.search_history.delete(q);
  };

  return (
    <PullToRefresh onRefresh={async () => handleSearch(query)}>
      <div className="px-0 pb-36">
        <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-white/5 pt-4 pb-2">
          {/* Mode Toggle - First */}
          <Tabs
            defaultValue={searchMode}
            onValueChange={(value) => setSearchMode(value as "global" | "library")}
            className="w-full mb-3"
          >
            <TabsList className="grid w-full grid-cols-2 bg-zinc-900 border border-white/5 rounded-xl p-1 h-auto">
              <TabsTrigger
                value="global"
                className="py-2.5 rounded-lg data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-500 text-xs font-bold transition-all"
              >
                <Globe size={14} className="mr-1.5" /> Глобальный
              </TabsTrigger>
              <TabsTrigger
                value="library"
                className="py-2.5 rounded-lg data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-500 text-xs font-bold transition-all"
              >
                <Library size={14} className="mr-1.5" /> Моя библиотека
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Category Selector - Second */}
          <div className="flex items-center gap-3 mb-3">
            <CategorySelector
              activeCategory={currentCategory}
              onCategoryChange={(cat) => {
                searchParams.set("category", cat);
                setSearchParams(searchParams);
              }}
              style={{ flex: 1, marginBottom: 0 }}
            />
          </div>

          {/* Search Bar */}
          <form
            onSubmit={(e) => handleSearch(query, e)}
            className="relative mb-2"
          >
            <Input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                searchMode === "global"
                  ? "Что ищем?"
                  : "Поиск в моей коллекции"
              }
              className="w-full pl-10 pr-10 py-6 bg-white/5 border-white/10 rounded-2xl text-base shadow-md focus-visible:ring-1 focus-visible:ring-primary/50 placeholder:text-zinc-500"
            />
            <SearchIcon
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setGlobalResults([]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                aria-label="Очистить поиск"
              >
                <X size={18} />
              </button>
            )}
          </form>
        </div>

        {/* Content Area */}
        <div>
        {!query && !loading && searchMode === "global" ? (
          <div style={{ paddingBottom: "2rem" }}>
            {/* Recent History */}
            {searchHistory && searchHistory.length > 0 && (
              <div style={{ marginBottom: "1.5rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      color: "var(--text-tertiary)",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    <History size={12} /> Недавнее
                  </div>
                  <button
                    onClick={clearHistory}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-tertiary)",
                      fontSize: "0.7rem",
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <div
                  style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}
                >
                  {searchHistory.map((h) => (
                    <motion.div
                      key={h.query}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        background: "rgba(255,255,255,0.05)",
                        padding: "0.4rem 0.6rem",
                        borderRadius: "8px",
                        cursor: "pointer",
                        border: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <span
                        onClick={() => {
                          setQuery(h.query);
                          handleSearch(h.query);
                        }}
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {h.query}
                      </span>
                      <X
                        size={12}
                        color="var(--text-tertiary)"
                        onClick={() => removeHistoryItem(h.query)}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Suggestions */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  color: "var(--text-tertiary)",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "0.75rem",
                }}
              >
                🚀{" "}
                {currentCategory === "movie"
                  ? "Сейчас в кино"
                  : currentCategory === "game"
                    ? "Популярные игры"
                    : "Популярные запросы"}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {(trendingSuggestions.length > 0
                  ? trendingSuggestions
                  : [
                      "Inception",
                      "Cyberpunk 2077",
                      "Harry Potter",
                      "Dune",
                      "Interstellar",
                    ]
                ).map((term) => (
                  <motion.button
                    key={term}
                    whileHover={{
                      scale: 1.05,
                      backgroundColor: "rgba(139, 92, 246, 0.2)",
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setQuery(term);
                      handleSearch(term);
                    }}
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "14px",
                      padding: "0.6rem 1.1rem",
                      color: "var(--text-secondary)",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      backdropFilter: "blur(10px)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    }}
                  >
                    {term}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          (query || loading || searchMode === "library") && (
            <div style={{ width: "100%" }}>
              {/* Search Results */}
              <div className="flex flex-col w-full">
                {/* Recognized Link Result */}
                {recognizedItem && (
                  <div style={{ gridColumn: "1 / -1", marginBottom: "1rem" }}>
                    <label
                      className="section-label"
                      style={{ marginBottom: "0.75rem" }}
                    >
                      Найдено по ссылке
                    </label>
                    <WideListItem
                      key={`recognized-${recognizedItem.source || 'local'}-${recognizedItem.externalId || recognizedItem.id || 'unknown'}`}
                      item={recognizedItem}
                      onClick={() => {
                        const targetId =
                          recognizedItem.id || recognizedItem.externalId;
                        const url = (
                          recognizedItem as Item & { isOwned?: boolean }
                        ).isOwned
                          ? `/item/${targetId}`
                          : `/item/${targetId}?source=${recognizedItem.source}`;
                        navigate(url);
                      }}
                      onAction={() => handleAdd(recognizedItem, true)}
                      isActive={(recognizedItem as any).isOwned}
                    />
                    <div
                      style={{
                        marginTop: "0.5rem",
                        fontSize: "0.75rem",
                        color: "var(--text-tertiary)",
                        textAlign: "center",
                      }}
                    >
                      Мы распознали этот контент по ссылке
                    </div>
                  </div>
                )}

                {results.length === 0 && loading
                  ? (
                      <div className="grid grid-cols-2 gap-3 w-full">
                        {[1, 2, 3, 4].map((_, idx) => (
                          <SkeletonCard key={`skeleton-${idx}`} />
                        ))}
                      </div>
                    )
                  : (
                      <div className="grid grid-cols-2 gap-3 w-full">
                        {results.map((item, idx) => {
                          const uniqueKey = `${item.source || 'local'}-${item.externalId || item.id || `item`}-${idx}`;
                          return (
                            <GridCard
                              key={uniqueKey}
                              item={item as Item & { isOwned?: boolean }}
                              index={idx}
                              onClick={() => {
                                const targetId = item.id || item.externalId;
                                const url = (item as any).isOwned
                                  ? `/item/${targetId}`
                                  : `/item/${targetId}?source=${item.source}&fromSearch=${encodeURIComponent(query)}`;
                                navigate(url);
                              }}
                              onQuickAdd={
                                !(item as any).isOwned
                                  ? () => handleAdd(item, true)
                                  : undefined
                              }
                            />
                          );
                        })}
                      </div>
                    )
                }
              </div>

              {searchMode === "global" && results.length > 0 && !loading && (
                <div
                  style={{
                    padding: "2rem 1rem",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={async () => {
                      vibrate("medium");
                      const result = await bulkAddPlannedItems(
                        results as Item[],
                      );
                      if (result.added > 0) {
                        showToast(
                          `Добавлено ${result.added} элементов`,
                          "success",
                        );
                        // Refresh state for global results to show 'Owned'
                        handleSearch(query);
                      } else if (result.skipped > 0) {
                        showToast("Все элементы уже в библиотеке", "info");
                      }
                    }}
                    style={{
                      background: "var(--primary-15)",
                      color: "var(--primary)",
                      border: "1px solid var(--primary-20)",
                      padding: "0 1rem",
                      height: "36px", // Slightly larger for search because it's a main action there
                      borderRadius: "var(--radius-md)",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      transition: "all 0.2s",
                    }}
                  >
                    <Plus size={16} strokeWidth={3} />
                    Добавить все результаты
                  </motion.button>
                </div>
              )}

              {!loading &&
                results.length === 0 &&
                (query || searchMode === "library") && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "4rem 1rem",
                      color: "var(--text-tertiary)",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        padding: "1.5rem",
                        borderRadius: "50%",
                        marginBottom: "1rem",
                      }}
                    >
                      <img src="/camera.png" alt="Empty" className="w-48 h-48 object-contain mb-2 drop-shadow-[0_0_30px_rgba(239,68,68,0.2)]" />
                    </div>
                    <p
                      style={{
                        margin: "0 0 0.5rem 0",
                        fontSize: "1.1rem",
                        fontWeight: 600,
                      }}
                    >
                      {searchMode === "library" && !query
                        ? "Библиотека пока пуста"
                        : "Ничего не найдено"}
                    </p>
                    <p
                      style={{
                        fontSize: "0.9rem",
                        maxWidth: "250px",
                        opacity: 0.7,
                      }}
                    >
                      {searchMode === "library" && !query
                        ? "Добавьте что-нибудь из глобального поиска, чтобы увидеть это здесь"
                        : "Попробуйте изменить запрос или поискать в другой категории"}
                    </p>
                  </motion.div>
                )}
            </div>
          )
        )}
        </div> {/* /Content Area */}
      </div>
    </PullToRefresh>
  );
};
