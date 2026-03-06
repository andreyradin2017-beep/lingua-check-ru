import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDiscoverData } from "../services/discover";
import type { Item } from "../types";
import { NumberedCard } from "./NumberedCard";

export const TopCarousel: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getDiscoverData();
        // Top 10 movies or games
        const topMovies = data.trending.slice(0, 10);
        setItems(topMovies);
      } catch {
        // Silent fail
      }
    };
    fetch();
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="mb-8 mt-4 pl-4">
      <h2 className="text-xl font-bold text-white mb-4">Топ-10 за месяц</h2>
      
      <div
        className="no-scrollbar flex overflow-x-auto pb-4"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((item, index) => (
          <NumberedCard
            key={`${item.source}-${item.externalId}`}
            item={item}
            index={index}
            onClick={() => {
              navigate(`/item/${item.externalId}?source=${item.source}`);
            }}
          />
        ))}
      </div>
    </div>
  );
};
