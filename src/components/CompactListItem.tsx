import React from "react";
import { ChevronRight, Film, Gamepad2, BookOpen, Activity } from "lucide-react";
import { getProxiedImageUrl } from "../utils/images";
import type { Item } from "../types";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CompactListItemProps {
  item: Item;
  onClick: () => void;
  style?: React.CSSProperties;
}

export const CompactListItem: React.FC<CompactListItemProps> = ({
  item,
  onClick,
  style,
}) => {
  const proxiedImage = getProxiedImageUrl(item.image);
  const getTypeColor = () => {
    switch (item.type) {
      case "movie":
        return "text-blue-500";
      case "game":
        return "text-purple-500";
      case "book":
        return "text-emerald-500";
      default:
        return "text-zinc-500";
    }
  };

  const getBgTypeColor = () => {
    switch (item.type) {
      case "movie":
        return "bg-blue-500";
      case "game":
        return "bg-purple-500";
      case "book":
        return "bg-emerald-500";
      default:
        return "bg-zinc-500";
    }
  };

  const getTypeIcon = () => {
    const colorClass = getTypeColor();
    switch (item.type) {
      case "movie":
        return <Film size={12} className={colorClass} />;
      case "game":
        return <Gamepad2 size={12} className={colorClass} />;
      case "book":
        return <BookOpen size={12} className={colorClass} />;
      default:
        return <Activity size={12} className={colorClass} />;
    }
  };

  const getStatusColor = () => {
    switch (item.status) {
      case "completed":
        return "bg-emerald-500";
      case "in_progress":
        return "bg-primary";
      default:
        return "bg-zinc-500";
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center gap-4 py-3 px-2 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors group"
      style={style}
    >
      {/* Thumbnail */}
      <div className="relative shrink-0 w-10 h-14 rounded overflow-hidden bg-zinc-900 shadow-md">
        {proxiedImage ? (
          <img
            src={item.image}
            alt={item.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover block"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-500 opacity-50">
            {getTypeIcon()}
          </div>
        )}

        {/* Status Dot */}
        <div
          className={cn(
            "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-black",
            getStatusColor()
          )}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="font-bold text-base text-zinc-100 whitespace-nowrap overflow-hidden text-ellipsis mb-1 group-hover:text-white transition-colors">
          {item.title}
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400 font-semibold">
          <span className="flex items-center gap-1">
            {getTypeIcon()}
            {item.year && <span>{item.year}</span>}
          </span>

          {/* Progress Bar */}
          {item.status === "in_progress" &&
            item.progress !== undefined &&
            item.totalProgress !== undefined && (
              <div className="flex-1 h-1 bg-white/10 rounded-full ml-1 max-w-[50px] overflow-hidden">
                <div
                  style={{
                    width: `${Math.min((item.progress / item.totalProgress) * 100, 100)}%`,
                  }}
                  className={cn("h-full rounded-full", getBgTypeColor())}
                />
              </div>
            )}
        </div>
      </div>

      {/* Action Handle */}
      <ChevronRight
        size={14}
        className="text-zinc-500 opacity-20 group-hover:opacity-100 transition-opacity"
      />
    </motion.div>
  );
};
