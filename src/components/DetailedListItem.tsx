import React from "react";
import {
  Star,
  Film,
  Gamepad2,
  BookOpen,
  Activity,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { getProxiedImageUrl } from "../utils/images";
import type { Item } from "../types";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface DetailedListItemProps {
  item: Item;
  onClick: () => void;
  style?: React.CSSProperties;
}

export const DetailedListItem: React.FC<DetailedListItemProps> = ({
  item,
  onClick,
  style,
}) => {
  const getTypeColor = () => {
    switch (item.type) {
      case "movie":
        return "var(--type-movie)";
      case "game":
        return "var(--type-game)";
      case "book":
        return "var(--type-book)";
      default:
        return "var(--text-tertiary)";
    }
  };

  const getTypeIcon = (size = 12) => {
    const typeColor = getTypeColor();
    switch (item.type) {
      case "movie":
        return <Film size={size} style={{ color: typeColor }} />;
      case "game":
        return <Gamepad2 size={size} style={{ color: typeColor }} />;
      case "book":
        return <BookOpen size={size} style={{ color: typeColor }} />;
      default:
        return <Activity size={size} style={{ color: typeColor }} />;
    }
  };

  const getStatusLabel = () => {
    switch (item.status) {
      case "completed":
        return "Готово";
      case "in_progress":
        return "В процессе";
      case "planned":
        return "В планах";
      default:
        return "";
    }
  };

  const getStatusColor = () => {
    switch (item.status) {
      case "completed":
        return "text-emerald-500 bg-emerald-500/10";
      case "in_progress":
        return "text-primary bg-primary/10";
      case "planned":
      default:
        return "text-zinc-400 bg-zinc-400/10";
    }
  };

  const proxiedImage = getProxiedImageUrl(item.image);
  const typeColor = getTypeColor();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={style}
    >
      <Card className="flex items-stretch gap-4 p-3 mb-2 cursor-pointer bg-zinc-950/50 hover:bg-zinc-900 border-white/5 transition-colors overflow-hidden relative group">
        {/* Thumbnail (2:3 aspect ratio) */}
        <div className="relative w-[30%] shrink-0 rounded-md overflow-hidden bg-zinc-900 shadow-md aspect-[2/3]">
          {proxiedImage ? (
            <img
              src={proxiedImage}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center opacity-30">
              {getTypeIcon(24)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 min-w-0 py-1">
          <div className="flex justify-between items-start gap-2">
            <h3 className="m-0 text-base font-bold text-zinc-100 font-main line-clamp-2">
              {item.title}
            </h3>
            {item.rating && (
              <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
                <Star size={12} fill="currentColor" />
                <span className="text-sm font-bold">{item.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className="flex items-center gap-1.5 text-[0.65rem] font-semibold text-zinc-400">
              {getTypeIcon(10)}
              {item.year || "N/A"}
            </span>
            <span
              className={cn(
                "text-[0.6rem] font-bold uppercase px-1.5 py-0.5 rounded-md",
                getStatusColor()
              )}
            >
              {getStatusLabel()}
            </span>
          </div>

          {item.description ? (
            <p className="text-xs text-zinc-500 mt-2 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          ) : (
            <div className="flex-1" />
          )}

          {/* Progress */}
          {item.status === "in_progress" && (
            <div className="mt-auto pt-2">
              <div className="flex justify-between items-center text-[0.65rem] mb-1">
                <span className="text-zinc-500">Прогресс</span>
                <span style={{ color: typeColor }} className="font-bold">
                  {item.progress || 0} / {item.totalProgress || "?"}
                </span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(((item.progress || 0) / (item.totalProgress || 1)) * 100, 100)}%`,
                  }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: typeColor, width: `${Math.min(((item.progress || 0) / (item.totalProgress || 1)) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <ChevronRight
          size={16}
          className="self-center text-zinc-500 opacity-30 group-hover:opacity-100 transition-opacity shrink-0"
        />
      </Card>
    </motion.div>
  );
};
