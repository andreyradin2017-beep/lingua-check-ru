import React from "react";
import { motion } from "framer-motion";
import { Film, Gamepad2, BookOpen, Plus, Activity } from "lucide-react";
import { getProxiedImageUrl } from "@utils/images";
import type { Item } from "@types";
import { vibrate } from "@utils/haptics";
import { CountdownBadge } from "@components/CountdownBadge";
import { LazyImage } from "@components/LazyImage";
import { cardVariants } from "@utils/animations";
import { getDetails } from "@services/api";
import { cn } from "@/lib/utils";

interface GridCardProps {
  item?: Item & { isOwned?: boolean };
  isAddCard?: boolean;
  onClick: () => void;
  onQuickAdd?: () => void;
  onLongPress?: () => void;
  index?: number;
}
export const GridCard: React.FC<GridCardProps & { enableMotion?: boolean }> = ({
  item,
  isAddCard,
  onClick,
  onQuickAdd,
  onLongPress,
  index = 0,
  enableMotion = true,
}) => {
  const handleClick = () => {
    // Basic click handler primarily for accessibility and fallbacks
    // The main interaction is now handled via framer-motion onTap
    vibrate("light");
    onClick();
  };

  const handlePrefetch = () => {
    if (item && !isAddCard) {
      // Background prefetch
      getDetails(item).catch(() => {});
    }
  };

  if (isAddCard) {
    return (
      <motion.div
        variants={enableMotion ? cardVariants : undefined}
        initial={enableMotion ? "hidden" : undefined}
        animate={enableMotion ? "visible" : undefined}
        custom={index}
        whileTap={{ scale: 0.95 }}
        onTap={() => {
          vibrate("light");
          onClick();
        }}
        role="button"
        aria-label="Добавить новый элемент"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        className="card-base flex-column flex-center"
        style={{
          aspectRatio: "2/3",
          borderStyle: "dashed",
          borderWidth: "1px",
          borderColor: "rgba(255,255,255,0.08)",
          cursor: "pointer",
          color: "var(--text-tertiary)",
        }}
      >
        <Plus size={32} />
        <span style={{ fontSize: "var(--font-sm)", fontWeight: 600 }}>
          Добавить
        </span>
      </motion.div>
    );
  }

  if (!item) return null;

  const getTypeIcon = () => {
    switch (item.type) {
      case "movie":
        return <Film size={12} />;
      case "game":
        return <Gamepad2 size={12} />;
      case "book":
        return <BookOpen size={12} />;
      default:
        return <Activity size={12} />;
    }
  };

  const getStatusInfo = () => {
    if (item.isOwned) {
      if (item.status === "in_progress") return { label: "В процессе", color: "var(--info)", pulse: true };
      if (item.status === "completed") return { label: "Завершено", color: "var(--success)", pulse: false };
      if (item.status === "planned") return { label: "В планах", color: "var(--warning)", pulse: false };
      return { label: "В коллекции", color: "var(--success)", pulse: false };
    }
    return null;
  };

  const getSourceInfo = () => {
    switch (item.source) {
      case "tmdb":
        return { label: "TMDB", color: "var(--brand-tmdb)" };
      case "kinopoisk":
        return { label: "КП", color: "#F5C518" };
      case "rawg":
        return { label: "RAWG", color: "var(--brand-rawg)" };
      case "google_books":
        return { label: "BOOKS", color: "var(--brand-google-books)" };
      case "litres":
        return { label: "LITRES", color: "#FF6B00" };
      default:
        return null;

    }
  };

  const statusInfo = getStatusInfo();
  const sourceInfo = getSourceInfo();

  return (
    <motion.div
      variants={enableMotion ? cardVariants : undefined}
      initial={enableMotion ? "hidden" : undefined}
      animate={enableMotion ? "visible" : undefined}
      custom={index}
      whileTap={{ scale: 0.98 }}
      onTap={(e) => {
        // Prevent click if we're tapping the quick add button
        const target = e.target as HTMLElement;
        if (target.closest("button")) return;

        vibrate("light");
        onClick();
      }}
      onContextMenu={(e) => {
        if (onLongPress) {
          e.preventDefault();
          vibrate("medium");
          onLongPress();
        }
      }}
      onPointerEnter={handlePrefetch}
      role="button"
      aria-label={`Открыть детали: ${item?.title}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      className="card-hover"
      style={{
        width: "100%",
        cursor: "pointer",
        position: "relative",
      }}
    >
      {/* Image Container */}
      <div
        className={cn(
          "relative aspect-[2/3] w-full rounded-xl overflow-hidden shadow-xl mb-2.5 transition-all duration-300",
          statusInfo?.pulse ? "border border-primary/30" : "border border-white/10",
          "bg-zinc-900 group-hover:shadow-2xl"
        )}
      >
        {/* Image or Placeholder */}
        {item.image ? (
          <motion.div
            layoutId={`item-image-${item.image}`}
            style={{ width: "100%", height: "100%" }}
          >
            <LazyImage
              src={getProxiedImageUrl(item.image)}
              alt={item.title}
              containerClassName="relative z-10"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                zIndex: 10,
                position: "relative",
              }}
              fallbackElement={
                <div
                  className="fallback-icon"
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-tertiary)",
                    backgroundColor: "var(--bg-surface)",
                    zIndex: 0,
                  }}
                >
                  {getTypeIcon()}
                </div>
              }
            />
          </motion.div>
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-tertiary)",
              backgroundColor: "var(--bg-surface)",
            }}
          >
            {getTypeIcon()}
          </div>
        )}

        <div
          className="flex-column"
          style={{
            position: "absolute",
            top: "var(--space-sm)",
            left: "var(--space-sm)",
            gap: "var(--space-xs)",
            zIndex: 20,
          }}
        >
          {statusInfo && (
            <div
              className="flex-center glass"
              style={{
                padding: "var(--space-xs) var(--space-sm)",
                borderRadius: "var(--radius-sm)",
                fontSize: "var(--font-xs)",
                fontWeight: 800,
                color: statusInfo.color,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                gap: "var(--space-xs)",
              }}
            >
              {statusInfo.pulse && (
                <motion.div
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: statusInfo.color,
                  }}
                />
              )}
              {statusInfo.label}
            </div>
          )}

          {sourceInfo && (
            <div
              style={{
                padding: "var(--space-xs) var(--space-xs)",
                background: "rgba(0,0,0,0.75)",
                backdropFilter: "blur(8px)",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.55rem",
                fontWeight: 900,
                color: sourceInfo.color,
                width: "fit-content",
                border: `1px solid ${sourceInfo.color}66`,
              }}
            >
              {sourceInfo.label}
            </div>
          )}

          {/* Countdown Badge for future releases */}
          {item.releaseDate && new Date(item.releaseDate) > new Date() && (
            <CountdownBadge
              releaseDate={new Date(item.releaseDate).toISOString()}
              compact
            />
          )}
        </div>
        {item.rating && (
          <div
            style={{
              position: "absolute",
              bottom: "var(--space-sm)",
              left: "var(--space-sm)",
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(4px)",
              padding: "var(--space-xs) var(--space-xs)",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-xs)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              zIndex: 25,
            }}
          >
            <span style={{ color: "#FFC107", fontSize: "0.7rem" }}>★</span>
            <span
              style={{
                color: "white",
                fontSize: "0.7rem",
                fontWeight: 800,
                lineHeight: 1,
              }}
            >
              {item.rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Quick Add Button */}
        {onQuickAdd && !item.isOwned && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onPointerDown={(e) => e.stopPropagation()}
            onTap={(e) => {
              e.stopPropagation();
              vibrate("medium");
              onQuickAdd();
            }}
            aria-label={`Добавить в коллекцию: ${item.title}`}
            className="flex-center"
            style={{
              position: "absolute",
              bottom: "var(--space-sm)",
              right: "var(--space-sm)",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "var(--primary)",
              border: "none",
              color: "white",
              zIndex: 25,
              boxShadow: "var(--shadow-glow)",
              cursor: "pointer",
            }}
          >
            <Plus size={18} strokeWidth={3} />
          </motion.button>
        )}

        {/* Type Indicator (Top Right) */}
        <div
          className="flex-center glass"
          style={{
            position: "absolute",
            top: "var(--space-sm)",
            right: "var(--space-sm)",
            padding: "var(--space-xs)",
            borderRadius: "50%",
            color: "white",
            zIndex: 20,
          }}
        >
          {getTypeIcon()}
        </div>

        {/* Status Color Bar (Bottom Edge) */}
        {(() => {
          const statusBarColors: Record<string, string> = {
            completed: "var(--success)",
            in_progress: "var(--primary)",
            planned: "rgba(255,255,255,0.15)",
          };
          const barColor =
            statusBarColors[item.status] || "rgba(255,255,255,0.1)";
          const hasProgress =
            item.status === "in_progress" &&
            item.progress !== undefined &&
            item.totalProgress &&
            item.totalProgress > 0;
          const progressPct = hasProgress
            ? Math.min((item.progress! / item.totalProgress!) * 100, 100)
            : 0;

          return (
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: hasProgress ? "3px" : "2px",
                background: hasProgress ? "rgba(0,0,0,0.5)" : barColor,
                zIndex: 25,
              }}
            >
              {hasProgress && (
                <div
                  style={{
                    width: `${progressPct}%`,
                    height: "100%",
                    background: "var(--primary)",
                    boxShadow: "0 0 10px var(--primary)",
                    transition: "width 0.3s ease",
                  }}
                />
              )}
            </div>
          );
        })()}
      </div>

      {/* Metadata Below Image */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1px",
          padding: "0 2px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "4px",
          }}
        >
          <h4
            style={{
              margin: 0,
              fontSize: "0.75rem",
              fontWeight: 600,
              fontFamily: "var(--font-main)",
              color: "var(--text-primary)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: "1.2",
              flex: 1,
            }}
          >
            {item.title}
          </h4>
          {item.type === "show" &&
            item.currentSeason &&
            item.currentEpisode && (
              <span
                style={{
                  fontSize: "var(--font-xs)",
                  color: "var(--primary)",
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                  background: "var(--primary-15)",
                  padding: "0.1rem 0.25rem",
                  borderRadius: "var(--radius-sm)",
                  textTransform: "uppercase",
                }}
              >
                S{item.currentSeason} E{item.currentEpisode}
              </span>
            )}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            flexWrap: "wrap",
          }}
        >
          {item.year && (
            <span
              style={{
                fontSize: "0.6rem",
                color: "var(--text-tertiary)",
                fontWeight: 600,
              }}
            >
              {item.year}
            </span>
          )}
          {item.tags && item.tags.length > 0 && (
            <span
              style={{
                fontSize: "0.6rem",
                color: "var(--primary)",
                fontWeight: 500,
                opacity: 0.8,
                maxWidth: "70%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              • {typeof item.tags[0] === 'object' ? (item.tags[0] as any).name : item.tags[0]}
              {item.tags.length > 1 && `, ${typeof item.tags[1] === 'object' ? (item.tags[1] as any).name : item.tags[1]}`}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
