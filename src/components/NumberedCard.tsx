import React from "react";
import { motion } from "framer-motion";
import { getProxiedImageUrl } from "../utils/images";
import type { Item } from "../types";

interface NumberedCardProps {
  item: Item;
  index: number;
  onClick: () => void;
}

export const NumberedCard: React.FC<NumberedCardProps> = ({ item, index, onClick }) => {
  const proxiedImage = getProxiedImageUrl(item.image);
  const number = index + 1;

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="relative flex flex-col items-start justify-end cursor-pointer group shrink-0 pt-8"
      style={{ width: "140px", height: "200px", marginRight: "1rem" }}
    >
      {/* Huge Background Number */}
      <div 
        className="absolute -left-6 bottom-4 text-[140px] leading-none font-bold z-0 pointer-events-none"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontFamily: "'Outfit', sans-serif"
        }}
      >
        {number}
      </div>

      {/* Poster */}
      <div className="relative z-10 w-[110px] h-[160px] rounded-xl overflow-hidden shadow-2xl ml-6 bg-zinc-900 ring-1 ring-white/10">
        {proxiedImage ? (
          <img 
            src={proxiedImage} 
            alt={item.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
          />
        ) : (
          <div className="w-full h-full bg-zinc-800 flex items-center justify-center p-2 text-center text-xs text-zinc-500">
            {item.title}
          </div>
        )}
      </div>

      {/* Title Below */}
      <div className="w-[110px] ml-6 mt-3 text-center">
        <p className="text-[11px] font-semibold text-zinc-300 truncate">
          {item.title}
        </p>
      </div>
    </motion.div>
  );
};
