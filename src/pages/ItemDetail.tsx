import React, { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { db } from "@db/db";
import type { Item } from "@types";

import { BentoTile } from "@components/BentoTile";
import { ItemHeader } from "@components/ItemHeader";
import { ItemStatsEditor } from "@components/ItemStatsEditor";
import { ItemMetadataDetails } from "@components/ItemMetadataDetails";
import { HLTBTile } from "@components/HLTBTile";
import { DetailDescription } from "@components/DetailDescription";
import { ItemNotesAndList } from "@components/ItemNotesAndList";
import { BookActions } from "@components/BookActions";
import { CastScroll } from "@components/CastScroll";
import { ScreenshotsCarousel } from "@components/ScreenshotsCarousel";
import { StreamingProviders } from "@components/StreamingProviders";
import { AuthorBooksRow } from "@components/AuthorBooksRow";
import { getDetails } from "@services/api";
import { useToast } from "@context/ToastContext";
import { notificationOccurred } from "@utils/haptics";
import { triggerAutoSync } from "@services/dbSync";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, ChevronLeft, Film, Gamepad2, BookOpen, Activity, Heart, Eye } from "lucide-react";
import { getProxiedImageUrl } from "@utils/images";

export const ItemDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);

  // Get the search query from URL params to restore it on back navigation
  const fromSearch = searchParams.get("fromSearch");
  const sourceParam = searchParams.get("source");

  // Handle back navigation - restore search with query if available
  const handleBack = () => {
    if (fromSearch) {
      const params = new URLSearchParams();
      params.set("q", fromSearch);
      if (sourceParam) params.set("source", sourceParam);
      params.set("category", item?.type === "show" || item?.type === "movie" ? "movie" : item?.type || "movie");
      navigate(`/search?${params.toString()}`, { replace: true });
    } else {
      navigate(-1);
    }
  };

  // Edit states
  const [status, setStatus] = useState<Item["status"]>("planned");
  const [notes, setNotes] = useState("");
  const [progress, setProgress] = useState(0);
  const [totalProgress, setTotalProgress] = useState(0);
  const [selectedListId, setSelectedListId] = useState<number | undefined>(
    undefined,
  );

  // Advanced States
  const [currentSeason, setCurrentSeason] = useState(1);
  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [isArchived, setIsArchived] = useState(false);

  const [extraMetadata, setExtraMetadata] = useState<{
    description?: string;
    genres?: string[];
    trailer?: string;
    providers?: { name: string; logo: string }[];
    related?: {
      externalId: string;
      title: string;
      image?: string;
      type: string;
    }[];
    hltb?: { main: string; extra: string; completionist: string };
    authors?: string[];
    platforms?: string[];
    developers?: string[];
    publishers?: string[];
    metacriticScore?: number;
    playtime?: number;
    website?: string;
    cast?: { name: string; character?: string; image?: string }[];
    screenshots?: string[];
  } | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);

  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    related: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const lists = useLiveQuery(() => db.lists.toArray());
  const queryParams = new URLSearchParams(window.location.search);
  const urlSourceParam = queryParams.get("source");

  useEffect(() => {
    if (id) {
      setLoading(true);

      const fetchItem = async () => {
        try {
          let found: Item | undefined;

          // 1. If source is specified, it's definitely an externalId lookup
          if (urlSourceParam && id) {
            found = await db.items
              .where("[externalId+source]")
              .equals([id, urlSourceParam])
              .first();
          }

          // 2. Try by local auto-increment ID (only if it looks like a local ID and no source was found)
          if (!found) {
            const numericId = Number(id);
            if (!isNaN(numericId)) {
              found = await db.items.get(numericId);
            }
          }

          // 3. Last resort: try externalId alone (backward compatibility)
          if (!found && id) {
            found = await db.items.where("externalId").equals(id).first();
          }

          // 4. Try searching by supabaseId (UUID)
          if (!found && id && id.includes("-")) {
            found = await db.items.where("supabaseId").equals(id).first();
          }

          if (found) {
            setItem(found);
            // If archived, status MUST be completed
            const initialStatus = found.isArchived ? "completed" : found.status;
            setStatus(initialStatus);
            setNotes(found.notes || "");
            setProgress(found.progress || 0);
            setTotalProgress(found.totalProgress || 0);
            setSelectedListId(found.listId);
            setCurrentSeason(found.currentSeason || 1);
            setCurrentEpisode(found.currentEpisode || 1);
            setIsArchived(found.isArchived || false);

            // Fetch external details in background
            if (found.externalId) {
              getDetails(found)
                .then((data: any) => {
                  if (data) setExtraMetadata(data);
                })
                .catch((error: any) => {
                  console.error("Failed to load external details:", error);
                });
            }
          } else if (urlSourceParam && id) {
            // Preview Mode: Item not in DB, but we have external ID and source
            // We fetch details to show the page
            try {
              const data = await getDetails({ externalId: id, source: urlSourceParam } as any);
              if (data) {
                setExtraMetadata(data);
                // Determine type by source if not explicit in data
                const bookSources = ["litres", "bookmate", "google_books"];
                const resolvedType = data.type
                  || (bookSources.includes(urlSourceParam!) ? "book" : "movie");
                setItem({
                  title: data.title || id,
                  type: resolvedType,
                  source: urlSourceParam as any,
                  externalId: id,
                  image: data.image || data.posterUrl,
                  description: data.description,
                  year: data.year,
                  tags: data.genres || [],
                  authors: data.authors || (data.author ? [data.author] : []),
                  rating: data.rating,
                  status: "planned",
                  createdAt: new Date(),
                  updatedAt: new Date(),
                } as Item);
              }
            } catch (err) {
              console.error("Failed to load preview details:", err);
            }
          }
          setLoading(false);
        } catch (err) {
          console.error("Failed to load item:", err);
          setLoading(false);
        }
      };

      fetchItem();
    }
  }, [id]);

  const { showToast } = useToast();

  // Wrap setStatus to handle archive sync
  const handleStatusChange = (newStatus: Item["status"]) => {
    setStatus(newStatus);
    if (newStatus === "completed") {
      setIsArchived(true);
    } else if (newStatus === "planned" || newStatus === "in_progress") {
      setIsArchived(false);
    }
  };

  const handleSave = async () => {
    if (!item?.id) return;

    // Final sync before save
    const finalArchived = isArchived || status === "completed";
    const finalStatus = finalArchived ? "completed" : status;

    await db.items.update(item.id, {
      status: finalStatus,
      notes,
      progress,
      totalProgress,
      listId: selectedListId,
      currentSeason,
      currentEpisode,
      isArchived: finalArchived,
      updatedAt: new Date(),
    });
    notificationOccurred("success");
    showToast("Изменения сохранены", "success");
    triggerAutoSync();
    handleBack();
  };

  const toggleArchive = async () => {
    if (!item?.id) return;
    const nextState = !isArchived;
    setIsArchived(nextState);
    await db.items.update(item.id, {
      isArchived: nextState,
      updatedAt: new Date(),
    });
    triggerAutoSync();
  };

  const handleUpdateStatus = async (currentItem: Item, newStatus: Item["status"]) => {
    if (!currentItem.id) return;
    
    // Update local state first
    handleStatusChange(newStatus);
    
    const archived = newStatus === "completed";
    
    await db.items.update(currentItem.id, { 
      status: newStatus, 
      isArchived: archived,
      updatedAt: new Date() 
    });
    
    notificationOccurred("success");
    showToast(newStatus === "completed" ? "Завершено и архивировано" : "Вернулось в работу", "success");
    triggerAutoSync();
  };

  const handleDelete = async () => {
    if (!item?.id || !window.confirm("Удалить этот элемент?")) return;

    if (item.supabaseId) {
      await db.deleted_metadata.put({
        id: item.supabaseId,
        table: "items",
        timestamp: Date.now(),
      });
    }

    await db.items.delete(item.id);
    notificationOccurred("success");
    showToast("Элемент удален", "info");
    triggerAutoSync();
    handleBack();
  };

  const handleQuickAddRecord = async (initialStatus: Item["status"] = "planned") => {
    if (!item) return;
    const newItem: Item = {
      ...item,
      status: initialStatus,
      isArchived: initialStatus === "completed",
      createdAt: new Date(),
      updatedAt: new Date(),
      // Auto-fill seasons/episodes for TV shows
      episodesPerSeason: (extraMetadata as any)?.episodesPerSeason,
      totalProgress: (extraMetadata as any)?.totalEpisodes,
    };
    if ("id" in newItem) delete (newItem as any).id;
    const newId = await db.items.add(newItem);
    notificationOccurred("success");
    showToast(`«${item.title}» добавлена в библиотеку`, "success");
    triggerAutoSync();
    // Swap URL to local ID to enable full editing without full page reload if possible
    // but navigating is cleaner
    navigate(`/item/${newId}`, { replace: true });
  };

  if (loading)
    return (
      <div className="flex-center" style={{ height: "100vh" }}>
        Загрузка...
      </div>
    );
  if (!item)
    return (
      <div className="flex-center" style={{ height: "100vh" }}>
        Элемент не найден
      </div>
    );

  const isTVShow = item.type === "show";

  return (
    <>
      <AnimatePresence>
        {showTrailer && extraMetadata?.trailer && (
          <div
            onClick={() => setShowTrailer(false)}
            className="flex-center"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              background: "rgba(0,0,0,0.9)",
              padding: "1rem",
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: "800px",
                aspectRatio: "16/9",
                background: "black",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              <iframe
                src={extraMetadata.trailer}
                style={{ width: "100%", height: "100%", border: "none" }}
                allowFullScreen
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Header Actions */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4 pt-safe flex items-center justify-between pointer-events-none">
        <button
          onClick={handleBack}
          className="w-10 h-10 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full text-white pointer-events-auto hover:bg-black/60 transition-colors shadow-lg border border-white/10"
        >
          <ChevronLeft size={24} />
        </button>
      </div>

      {/* Hero Image */}
      <div className="relative w-[calc(100%+2rem)] -mx-4 -mt-4 h-[60vh] max-h-[600px] min-h-[400px] bg-black">
        {item.image ? (
          <img
            src={getProxiedImageUrl(item.image)}
            alt={item.title}
            className="w-full h-full object-cover opacity-80"
            style={{ maskImage: "linear-gradient(to bottom, black 50%, rgba(0,0,0,0) 100%)", WebkitMaskImage: "linear-gradient(to bottom, black 50%, rgba(0,0,0,0) 100%)" }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600/50 pb-20">
            {item.type === "movie" || item.type === "show" ? <Film size={64} /> :
             item.type === "game" ? <Gamepad2 size={64} /> :
             item.type === "book" ? <BookOpen size={64} /> :
             <Activity size={64} />}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />
      </div>

      <div className="relative z-10 -mt-32 pb-32 max-w-3xl mx-auto flex flex-col gap-3">
          <ItemHeader
            title={item.title}
            type={item.type}
            year={item.year}
            hasTrailer={!!extraMetadata?.trailer}
            source={item.source}
            genres={extraMetadata?.genres || item.tags}
            authors={extraMetadata?.authors || item.authors}
            platforms={extraMetadata?.platforms || item.platforms}
            onShowTrailer={() => setShowTrailer(true)}
            onAuthorClick={(author) => {
              navigate(`/search?q=${encodeURIComponent(author)}&category=book`);
            }}
            actionButtons={
              <>
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    if (!item.id) handleQuickAddRecord("planned");
                    else handleUpdateStatus(item, "planned");
                  }}
                  className="w-[50px] h-[50px] rounded-full border border-white/20 bg-black/40 backdrop-blur-md flex items-center justify-center text-white transition-colors duration-300 hover:bg-white/10"
                >
                  <Heart 
                    size={20} 
                    fill={item.status === "planned" ? "currentColor" : "none"} 
                    className={item.status === "planned" ? "text-yellow-400" : ""} 
                  />
                </motion.button>
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    if (!item.id) handleQuickAddRecord("in_progress");
                    else handleUpdateStatus(item, "in_progress");
                  }}
                  className="w-[50px] h-[50px] rounded-full border border-white/20 bg-black/40 backdrop-blur-md flex items-center justify-center text-white transition-colors duration-300 hover:bg-white/10"
                >
                  <Eye 
                    size={20} 
                    className={item.status === "in_progress" ? "text-primary" : ""} 
                  />
                </motion.button>
              </>
            }
          />

        {/* Row 1.5: Description */}
        {(item.description || extraMetadata?.description) && (
          <DetailDescription
            description={extraMetadata?.description || item.description || ""}
            delay={0.15}
          />
        )}

        {/* Streaming Providers */}
        {extraMetadata?.providers && extraMetadata.providers.length > 0 && (
          <BentoTile colSpan={2} delay={0.16}>
            <StreamingProviders providers={extraMetadata.providers} />
          </BentoTile>
        )}

        {/* Screenshots (Games) */}
        {item.type === "game" && extraMetadata?.screenshots && extraMetadata.screenshots.length > 0 && (
          <BentoTile colSpan={2} delay={0.17}>
            <ScreenshotsCarousel screenshots={extraMetadata.screenshots} />
          </BentoTile>
        )}

        {/* Game completion time */}
        {item.type === "game" && (extraMetadata?.hltb || (extraMetadata as any)?.playtime) && (
          <HLTBTile
            hltb={extraMetadata?.hltb}
            playtime={(extraMetadata as any)?.playtime}
            delay={0.18}
          />
        )}

        {/* Cast (Movies/Shows) */}
        {(item.type === "movie" || item.type === "show") && extraMetadata?.cast && extraMetadata.cast.length > 0 && (
          <BentoTile colSpan={2} delay={0.19}>
            <CastScroll 
              cast={extraMetadata.cast} 
              onActorClick={(name) => {
                navigate(`/search?q=${encodeURIComponent(name)}&category=${item.type}`);
              }}
            />
          </BentoTile>
        )}

        {/* Row 2: Status Tracking or Add Button */}
        <BentoTile colSpan={2} delay={0.2}>
          {item.id ? (
            <ItemStatsEditor
              status={status}
              itemType={item.type}
              isArchived={isArchived}
              isTVShow={isTVShow}
              currentSeason={currentSeason}
              currentEpisode={currentEpisode}
              progress={progress}
              totalProgress={totalProgress}
              episodesPerSeason={item.episodesPerSeason}
              numberOfSeasons={(extraMetadata as any)?.numberOfSeasons}
              onStatusChange={handleStatusChange}
              onArchiveToggle={toggleArchive}
              onSeasonChange={setCurrentSeason}
              onEpisodeChange={setCurrentEpisode}
              onProgressChange={setProgress}
            />
          ) : (
            <div
              className="flex-center flex-column"
              style={{ padding: "1.5rem", gap: "1rem" }}
            >
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                  textAlign: "center",
                  margin: 0,
                }}
              >
                Этот элемент еще не добавлен в вашу библиотеку
              </p>
              <button
                onClick={() => handleQuickAddRecord("planned")}
                className="flex-center"
                style={{
                  width: "100%",
                  padding: "0.85rem",
                  borderRadius: "12px",
                  background: "var(--primary)",
                  color: "white",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  gap: "0.5rem",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
                }}
              >
                <Plus size={18} /> Добавить в планы
              </button>
            </div>
          )}
        </BentoTile>

        {/* Row 3: Notes & List (Only if owned) */}
        {item.id ? (
          <ItemNotesAndList
            notes={notes}
            setNotes={setNotes}
            selectedListId={selectedListId}
            setSelectedListId={setSelectedListId}
            lists={lists}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        ) : null}

        {/* Row 3.5: Book Actions (LitRes / Yandex links) */}
        {item.type === "book" && (
          <BentoTile colSpan={2} delay={0.4}>
            <BookActions 
              source={item.source || "manual"} 
              externalId={item.externalId || ""} 
              title={item.title}
            />
          </BentoTile>
        )}

        {/* Row 3.6: Author's Other Books */}
        {item.type === "book" && (item.authors?.[0] || extraMetadata?.authors?.[0]) && (
          <BentoTile colSpan={2} delay={0.45}>
            <AuthorBooksRow 
              authorName={item.authors?.[0] || extraMetadata?.authors?.[0] || ""}
              onBookClick={(book) => {
                navigate(`/item/${book.externalId}?source=${book.source}`);
              }}
            />
          </BentoTile>
        )}

        {/* Row 4: External Metadata */}
        {extraMetadata?.related && extraMetadata.related.length > 0 ? (
          <BentoTile colSpan={2} delay={0.5} style={{ padding: "0.5rem 0" }}>
            <ItemMetadataDetails
              extraMetadata={extraMetadata}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
              onNavigateToSearch={(title, source, type) => {
                const params = new URLSearchParams({ q: title });
                if (source) params.set("source", source);
                if (type) params.set("type", type);
                navigate(`/search?${params.toString()}`);
              }}
            />
          </BentoTile>
        ) : null}
      </div>
    </>
  );
};
