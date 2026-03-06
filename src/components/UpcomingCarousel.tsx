import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getDiscoverData } from "../services/discover";
import type { Item } from "../types";
import { getProxiedImageUrl } from "../utils/images";
import { CountdownBadge } from "./CountdownBadge";
import { db } from "../db/db";
import { Calendar, Film, Gamepad2, Bookmark } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";

export const UpcomingCarousel: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const navigate = useNavigate();

  // Get owned items to show bookmark indicator
  const ownedItems = useLiveQuery(() => db.items.toArray(), []);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getDiscoverData();
        const now = new Date();

        // 1. Filter movies
        const validMovies = data.upcoming
          .filter((i) => i.releaseDate && new Date(i.releaseDate) > now)
          .slice(0, 10);

        // 2. Filter games
        const validGames = data.upcomingGames
          .filter((i) => i.releaseDate && new Date(i.releaseDate) > now)
          .slice(0, 10);

        // 3. Combine and sort by date (ascending)
        const combined = [...validMovies, ...validGames].sort((a, b) => {
          const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
          const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
          return dateA - dateB;
        });

        setItems(combined.slice(0, 15));
      } catch {
        // Silent fail
      }
    };
    fetch();
  }, []);

  if (items.length === 0) return null;

  const isOwned = (item: Item) => {
    return ownedItems?.some(
      (owned) =>
        owned.externalId === item.externalId && owned.source === item.source,
    );
  };

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.8rem",
          padding: "0 0.5rem",
        }}
      >
        <Calendar size={16} className="text-secondary" />
        <h2
          style={{
            fontSize: "1rem",
            fontWeight: 700,
            margin: 0,
            color: "var(--text-primary)",
          }}
        >
          Скоро выходят
        </h2>
      </div>

      <div
        className="no-scrollbar"
        style={{
          display: "flex",
          gap: "0.8rem",
          overflowX: "auto",
          padding: "0 0.5rem 0.6rem",
          scrollbarWidth: "none",
        }}
      >
        {items.map((item) => (
          <motion.div
            key={`${item.source}-${item.externalId}`}
            whileTap={{ scale: 0.95 }}
            onClick={async () => {
              if (item.externalId) {
                const existing = await db.items
                  .where("[externalId+source]")
                  .equals([item.externalId, item.source || ""])
                  .first();
                if (existing) {
                  navigate(`/item/${existing.id}`);
                  return;
                }
              }
              navigate("/discover");
            }}
            style={{
              minWidth: "150px",
              width: "150px",
              flexShrink: 0,
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: "100%",
                aspectRatio: "16/9",
                borderRadius: "14px",
                overflow: "hidden",
                position: "relative",
                border: "1px solid rgba(255,255,255,0.08)",
                marginBottom: "0.6rem",
                background: "var(--bg-card)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              }}
            >
              <img
                src={getProxiedImageUrl(item.image || "")}
                alt={item.title}
                loading="lazy"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />

              {/* Type Indicator Icon */}
              <div
                style={{
                  position: "absolute",
                  top: "6px",
                  right: "6px",
                  padding: "4px",
                  borderRadius: "8px",
                  background: "rgba(0,0,0,0.5)",
                  backdropFilter: "blur(4px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {item.type === "game" ? (
                  <Gamepad2 size={12} style={{ color: "var(--primary)" }} />
                ) : (
                  <Film size={12} style={{ color: "var(--secondary)" }} />
                )}
              </div>

              {/* Owned Indicator */}
              {isOwned(item) && (
                <div
                  style={{
                    position: "absolute",
                    top: "6px",
                    left: "6px",
                    padding: "4px",
                    borderRadius: "8px",
                    background: "rgba(52, 211, 153, 0.2)",
                    backdropFilter: "blur(4px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(52, 211, 153, 0.3)",
                  }}
                >
                  <Bookmark size={12} style={{ color: "var(--success)" }} />
                </div>
              )}

              <div
                style={{
                  position: "absolute",
                  bottom: "0",
                  left: "0",
                  right: "0",
                  padding: "24px 8px 8px",
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.9), transparent)",
                }}
              >
                {item.releaseDate && (
                  <CountdownBadge
                    releaseDate={new Date(item.releaseDate).toISOString()}
                    compact
                  />
                )}
              </div>
            </div>
            <p
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                margin: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                color: "var(--text-primary)",
                padding: "0 2px",
              }}
            >
              {item.title}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
