import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getDiscoverData } from "../services/discover";
import type { Item } from "../types";
import { getProxiedImageUrl } from "../utils/images";

export const Hero: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getDiscoverData();
        if (data.trending && data.trending.length > 0) {
          setItems(data.trending.slice(0, 5));
        }
      } catch {
        // Silent fail
      }
    };
    fetch();
  }, []);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (items.length === 0) return <div className="h-[75vh] w-full bg-zinc-900 animate-pulse" />;

  const item = items[currentIndex];
  const imageUrl = getProxiedImageUrl(item?.image);

  return (
    <div 
      className="relative w-[calc(100%+2rem)] -mx-4 -mt-4 h-[75vh] min-h-[500px] bg-black overflow-hidden flex flex-col justify-end pb-16 px-8 cursor-pointer group"
      onClick={() => navigate(`/item/${item.externalId}?source=${item.source}`)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={item.externalId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-zinc-900 transition-transform duration-[10s] ease-out group-hover:scale-110 scale-105"
            style={{
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center 20%"
            }}
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />

          {/* Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute bottom-16 left-8 right-8 z-10"
          >
            <span className="inline-block px-3 py-1 mb-3 rounded-full bg-yellow-400 text-black text-xs font-bold uppercase tracking-wider">
              Выбор редакции
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2 leading-tight">
              {item.title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-zinc-300 font-medium mb-4">
              <span className="text-emerald-400 font-bold">{item.rating?.toFixed(1) || "New"}</span>
              <span>•</span>
              <span>{item.year || "2024"}</span>
              <span>•</span>
              <span>{item.type === "movie" ? "Кино" : item.type === "game" ? "Игра" : "Книга"}</span>
            </div>
            
            <p className="text-sm text-zinc-400 line-clamp-2 max-w-[80%]">
              {item.description || "Захватывающая история, которая не оставит вас равнодушным. Начните просмотр или добавьте в закладки на потом."}
            </p>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
        {items.map((_, idx) => (
          <div 
            key={idx} 
            className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 bg-yellow-400' : 'w-1.5 bg-white/30'}`}
          />
        ))}
      </div>
    </div>
  );
};
