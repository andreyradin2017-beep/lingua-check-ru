import React, { useEffect, useState } from "react";
import {
  Flame,
  Calendar,
  Gamepad2,
  CalendarClock,
  Sparkles,
  Plus,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getDiscoverData } from "@services/discover";
import { CategorySelector } from "@components/CategorySelector";
import { db } from "@db/db";
import { useLiveQuery } from "dexie-react-hooks";
import type { Item } from "@types";
import { PageHeader } from "@components/PageHeader";
import { motion } from "framer-motion";
import { vibrate } from "@utils/haptics";
import { useToast } from "@context/ToastContext";
import { triggerAutoSync } from "@services/dbSync";
import { Section } from "@components/Section";
import { GridCard } from "@components/GridCard";
import { getDetails } from "@services/api";
import { bulkAddPlannedItems } from "@services/itemService";
import { useAutoAnimate } from "@formkit/auto-animate/react";

interface DiscoverSection {
  title: string;
  icon: React.ReactNode;
  items: Item[];
  gradient: string;
  category?: "movie" | "game" | "book";
}

const CATEGORY_GENRES: Record<string, string[]> = {
  movie: ["Все", "Экшен", "Драма", "Комедия", "Фантастика", "Фэнтези", "Ужасы", "Мультфильм", "Триллер"],
  game: ["Все", "Экшен", "RPG", "Шутер", "Стратегия", "Приключения", "Симулятор", "Пазл", "Спорт"],
  book: ["Все", "Фэнтези", "Фантастика", "Роман", "Детектив", "Триллер", "Классика", "Биография", "Психология"],
};

export const Discover: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentCategory = (searchParams.get("category") as "movie" | "game" | "book") || "movie";
  const [sections, setSections] = useState<DiscoverSection[]>([]);
  const [personalized, setPersonalized] = useState<DiscoverSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGenre, setActiveGenre] = useState("Все");
  const [parent] = useAutoAnimate();
  const [personalParent] = useAutoAnimate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Force refresh if data seems stale or lacks tags
        const data = await getDiscoverData();
        const allSections = [
          {
            title: "Популярное сейчас",
            icon: <Flame size={16} />,
            items: data.trending,
            gradient:
              "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(234, 88, 12, 0.08))",
            category: "movie",
          },
          {
            title: "Скоро в кино",
            icon: <Calendar size={16} />,
            items: data.upcoming,
            gradient:
              "linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.08))",
            category: "movie",
          },
          {
            title: "Игровые новинки",
            icon: <Gamepad2 size={16} />,
            items: data.newGames,
            gradient:
              "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.08))",
            category: "game",
          },
          {
            title: "Скоро в играх",
            icon: <CalendarClock size={16} />,
            items: data.upcomingGames,
            gradient:
              "linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(251, 191, 36, 0.08))",
            category: "game",
          },
          {
            title: "Популярные книги",
            icon: <Flame size={16} />,
            items: data.trendingBooks || [],
            gradient: "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(139, 92, 246, 0.08))",
            category: "book",
          },
          {
            title: "Книжные новинки",
            icon: <Calendar size={16} />,
            items: data.newBooks || [],
            gradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(59, 130, 246, 0.08))",
            category: "book",
          },
        ];

        setSections(allSections as any);

        // Personalization logic
        const allItems = await db.items
          .orderBy("createdAt")
          .reverse()
          .limit(50)
          .toArray();
          
        const lastItems: Item[] = [];
        const lastMovieShow = allItems.find(i => i.type === "movie" || i.type === "show");
        if (lastMovieShow) lastItems.push(lastMovieShow);
        
        const lastGame = allItems.find(i => i.type === "game");
        if (lastGame) lastItems.push(lastGame);
        
        const lastBook = allItems.find(i => i.type === "book");
        if (lastBook) lastItems.push(lastBook);

        if (lastItems.length > 0) {
          const recPromises = lastItems.map((item) => getDetails(item));
          const recResults = await Promise.all(recPromises);

          const personal: DiscoverSection[] = [];

          recResults.forEach((details, index) => {
            if (details?.related && details.related.length > 0) {
              const baseItem = lastItems[index];
              const categoryMap: Record<string, "movie" | "game" | "book"> = {
                "movie": "movie",
                "show": "movie",
                "game": "game",
                "book": "book",
              };
              
              personal.push({
                title: `Похоже на «${baseItem.title}»`,
                icon: <Sparkles size={16} />,
                items: details.related,
                gradient:
                  "linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))",
                category: categoryMap[baseItem.type] || "movie",
              });
            }
          });

          setPersonalized(personal);
        }
      } catch (error) {
        console.error("Discover fetch failed:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showToast]);

  const handleAdd = async (item: Item, silent = false) => {
    // Check if item already exists in local DB
    if (item.externalId) {
      const existing = await db.items
        .where("[externalId+source]")
        .equals([item.externalId, item.source || ""])
        .first();

      if (existing) {
        return existing.id;
      }
    }

    const newItem: Item = {
      ...item,
      status: "planned",
      tags: item.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Remove existing ID if present from enhanceItem to allow auto-increment
    if ("id" in newItem) delete (newItem as { id?: number }).id;

    const id = await db.items.add(newItem);
    if (!silent) {
      vibrate("medium");
      triggerAutoSync();
      showToast(`«${item.title}» в планах`, "success");
    }
    return id;
  };

  const ownedItems = useLiveQuery(() => db.items.toArray());

  // Create a memoized lookup map for performance
  const ownedMap = React.useMemo(() => {
    const map = new Map<string, any>();
    ownedItems?.forEach((item) => {
      if (item.externalId) map.set(`${item.externalId}|${item.source}`, item);
    });
    return map;
  }, [ownedItems]);

  const enhanceItem = (item: Item) => {
    const owned = ownedMap.get(`${item.externalId}|${item.source}`);
    return {
      ...item,
      isOwned: !!owned,
      id: owned?.id,
    };
  };

  const filterItems = (items: Item[] = []) => {
    if (!items) return [];
    const enhanced = items.map(enhanceItem);
    if (activeGenre === "Все") return enhanced;
    const searchGenre = activeGenre.toLowerCase();
    return enhanced.filter((item) =>
      item.tags?.some((tag) => tag.toLowerCase().includes(searchGenre)),
    );
  };

  return (
    <div style={{ paddingBottom: "2rem" }}>
      <PageHeader title="Открытия" showBack />

      {/* Category Selector */}
      <div className="mb-4">
        <CategorySelector
          style={{ marginLeft: "-4px" }}
          activeCategory={currentCategory}
          onCategoryChange={(cat) => {
            searchParams.set("category", cat);
            setSearchParams(searchParams);
            setActiveGenre("Все");
            vibrate("light");
          }}
        />
      </div>

      {/* Genre Chips */}
      <div
        className="no-scrollbar"
        style={{
          display: "flex",
          gap: "0.6rem",
          overflowX: "auto",
          padding: "0 1.25rem 1.2rem 0",
          scrollbarWidth: "none",
        }}
      >
        {CATEGORY_GENRES[currentCategory].map((genre) => (
          <motion.button
            key={genre}
            whileTap={{ scale: 0.92 }}
            onClick={() => setActiveGenre(genre)}
            style={{
              padding: "0.5rem 1.1rem",
              borderRadius: "20px",
              fontSize: "0.85rem",
              fontWeight: 600,
              whiteSpace: "nowrap",
              background:
                activeGenre === genre
                  ? "var(--primary)"
                  : "rgba(255,255,255,0.05)",
              color: activeGenre === genre ? "#fff" : "var(--text-secondary)",
              border: "1px solid rgba(255,255,255,0.08)",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {genre}
          </motion.button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: "0" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ marginBottom: "2rem" }}>
              <div
                style={{
                  height: "20px",
                  width: "140px",
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: "8px",
                  marginBottom: "0.75rem",
                }}
              />
              <div style={{ display: "flex", gap: "0.75rem" }}>
                {[1, 2, 3].map((j) => (
                  <div
                    key={j}
                    style={{
                      width: "130px",
                      aspectRatio: "2/3",
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: "16px",
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.8rem" }}
        >
          {/* Personalized Sections */}
          {personalized.map((section, sIdx) => {
            if (section.category && section.category !== currentCategory) return null;
            const filteredPersonal = filterItems(section.items);
            if (filteredPersonal.length === 0) return null;
            return (
              <Section
                key={`${section.title}-${sIdx}`}
                title={section.title}
                icon={section.icon}
                badge={filteredPersonal.length}
                plain
                rightElement={
                  filteredPersonal.length > 0 && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={async (e) => {
                        e.stopPropagation();
                        vibrate("medium");
                        const result =
                          await bulkAddPlannedItems(filteredPersonal);
                        if (result.added > 0) {
                          showToast(
                            `Добавлено ${result.added} элементов`,
                            "success",
                          );
                        } else if (result.skipped > 0) {
                          showToast("Все элементы уже в библиотеке", "info");
                        }
                      }}
                      style={{
                        padding: "0 0.75rem",
                        height: "32px",
                        borderRadius: "var(--radius-md)",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        background: "var(--primary-15)",
                        color: "var(--primary)",
                        border: "1px solid var(--primary-20)",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      <Plus size={12} strokeWidth={3} />
                      Добавить все
                    </motion.button>
                  )
                }
              >
                <div
                  className="no-scrollbar"
                  ref={personalParent}
                  style={{
                    display: "flex",
                    gap: "0.8rem",
                    overflowX: "auto",
                    padding: "0 0.25rem 0.5rem",
                    scrollbarWidth: "none",
                  }}
                >
                  {filteredPersonal.map((item, idx) => (
                    <div
                      key={`${item.source || "src"}-${item.externalId || idx}`}
                      style={{
                        minWidth: "124px",
                        width: "124px",
                        flexShrink: 0,
                      }}
                    >
                      <GridCard
                        item={item}
                        onQuickAdd={() => handleAdd(item)}
                        onClick={() => {
                          const targetId = item.id || item.externalId;
                          const url = item.isOwned
                            ? `/item/${targetId}`
                            : `/item/${targetId}?source=${item.source}`;
                          navigate(url);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </Section>
            );
          })}

          {/* Regular Sections */}
          {sections
            .filter((s: any) => s.category === currentCategory)
            .map((section, sIdx) => {
              const filtered = filterItems(section.items);
              if (filtered.length === 0 && activeGenre !== "Все") return null;

              return (
                <Section
                  key={`${section.title}-${sIdx}`}
                  title={section.title}
                  icon={section.icon}
                  badge={filtered.length}
                  plain
                  rightElement={
                    filtered.length > 0 && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={async (e) => {
                          e.stopPropagation();
                          vibrate("medium");
                          const result = await bulkAddPlannedItems(filtered);
                          if (result.added > 0) {
                            showToast(
                              `Добавлено ${result.added} элементов`,
                              "success",
                            );
                          } else if (result.skipped > 0) {
                            showToast("Все элементы уже в библиотеке", "info");
                          }
                        }}
                        style={{
                          padding: "0 0.75rem",
                          height: "32px",
                          borderRadius: "var(--radius-md)",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          background: "var(--primary-15)",
                          color: "var(--primary)",
                          border: "1px solid var(--primary-20)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        <Plus size={12} strokeWidth={3} />
                        Добавить все
                      </motion.button>
                    )
                  }
                >
                  {filtered.length > 0 ? (
                    <div
                      className="no-scrollbar"
                      ref={parent}
                      style={{
                        display: "flex",
                        gap: "0.8rem",
                        overflowX: "auto",
                        padding: "0 0.25rem 0.5rem",
                        scrollbarWidth: "none",
                      }}
                    >
                      {filtered.map((item, idx) => (
                        <div
                          key={`${item.source || "src"}-${item.externalId || idx}`}
                          style={{
                            minWidth: "124px",
                            width: "124px",
                            flexShrink: 0,
                          }}
                        >
                          <GridCard
                            item={item}
                            onQuickAdd={() => handleAdd(item)}
                            onClick={() => {
                              const targetId = item.id || item.externalId;
                              const url = item.isOwned
                                ? `/item/${targetId}`
                                : `/item/${targetId}?source=${item.source}`;
                              navigate(url);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: "2rem",
                        textAlign: "center",
                        color: "var(--text-tertiary)",
                        fontSize: "0.8rem",
                      }}
                    >
                      В жанре «{activeGenre}» пока ничего не найдено
                    </div>
                  )}
                </Section>
              );
            })}
        </div>
      )}
    </div>
  );
};
