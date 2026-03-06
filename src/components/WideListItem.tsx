import React from "react";
import { motion } from "framer-motion";
import { getProxiedImageUrl } from "../utils/images";
import type { Item } from "../types";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface WideListItemProps {
  item: Item;
  onClick: () => void;
  onAction?: (e: React.MouseEvent) => void;
  actionIcon?: React.ReactNode;
  isActive?: boolean;
}

export const WideListItem: React.FC<WideListItemProps> = ({
  item,
  onClick,
  onAction,
  actionIcon,
  isActive
}) => {
  const proxiedImage = getProxiedImageUrl(item.image);

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center gap-4 mb-4 cursor-pointer group"
    >
      {/* Thumbnail (16:9) */}
      <div className="relative w-[140px] shrink-0 rounded-[14px] overflow-hidden bg-zinc-900 aspect-video shadow-lg">
        {proxiedImage ? (
           <img 
              src={proxiedImage} 
              alt={item.title || "Poster"} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
           />
        ) : (
           <div className="w-full h-full bg-zinc-900/50 flex items-center justify-center" />
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 min-w-0">
        <h3 className="text-[15px] font-bold text-zinc-100 leading-tight mb-1 line-clamp-2">
          {item.title}
        </h3>
        <span className="text-xs text-zinc-500 font-medium mb-1">
          {item.type === "movie" || item.type === "show" ? "Кино / Сериал" : item.type === "game" ? "Игра" : "Книга"}
        </span>
        <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-medium">
          {item.rating && <span className="text-yellow-500">{item.rating.toFixed(1)} ★</span>}
          {item.year && <span>{item.rating ? "• " : ""}{item.year}</span>}
        </div>
        {item.source && (
          <div className="mt-1.5 flex items-center">
            <span className="text-[9px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded uppercase font-bold text-zinc-400">
              {item.source === "google_books" ? "BOOKS" : 
               item.source === "kinopoisk" ? "КИНОПОИСК" : 
               item.source}

            </span>
          </div>
        )}
      </div>

      {/* Action Button */}
      {onAction && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAction(e);
          }}
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300",
            isActive 
              ? "bg-red-500/20 text-red-500" 
              : "bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700 hover:text-white"
          )}
        >
          {actionIcon || <Plus size={18} strokeWidth={2.5} />}
        </button>
      )}
    </motion.div>
  );
};
