import React from "react";
import { motion } from "framer-motion";
import { FolderOpen } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import type { List } from "../types";
import { getProxiedImageUrl } from "../utils/images";

interface CollectionCardProps {
  list: List;
  onClick: () => void;
}

export const CollectionCard: React.FC<CollectionCardProps> = ({
  list,
  onClick,
}) => {
  // Get items in this list for collage + count
  const items = useLiveQuery(
    () => db.items.where("listId").equals(list.id!).toArray(),
    [list.id],
  );

  const count = items?.length || 0;
  const covers = (items || [])
    .filter((i) => i.image)
    .slice(0, 3) // Only need 3 for the fanned look
    .map((i) => i.image!);

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        width: "130px",
        minWidth: "130px",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      {/* Card Container */}
      <div
        style={{
          width: "100%",
          aspectRatio: "1",
          borderRadius: "14px",
          position: "relative",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "0.4rem",
        }}
      >
        {covers.length > 0 ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              position: "relative",
              padding: "12px",
            }}
          >
            {/* Fanned/Stacked covers */}
            {covers.map((src, i) => (
              <img
                key={i}
                src={getProxiedImageUrl(src)}
                alt=""
                loading="lazy"
                decoding="async"
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                  // Fanned effect
                  top: `${i * 8}px`,
                  left: `${i * 8}px`,
                  transform: `rotate(${i * 3}deg)`,
                  zIndex: covers.length - i,
                }}
              />
            ))}
          </div>
        ) : (
          <FolderOpen
            size={32}
            strokeWidth={1.5}
            style={{ color: "var(--text-tertiary)", opacity: 0.5 }}
          />
        )}

        {/* Count Badge */}
        {count > 0 && (
          <div
            style={{
              position: "absolute",
              top: "6px",
              right: "6px",
              background: "rgba(139, 92, 246, 0.25)",
              backdropFilter: "blur(8px)",
              color: "var(--primary)",
              padding: "2px 6px",
              borderRadius: "6px",
              fontSize: "0.65rem",
              fontWeight: 700,
              border: "1px solid rgba(139, 92, 246, 0.3)",
              zIndex: 100,
            }}
          >
            {count}
          </div>
        )}
      </div>

      {/* List Name */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.3rem",
        }}
      >
        {list.icon && <span style={{ fontSize: "0.8rem" }}>{list.icon}</span>}
        <p
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: "var(--text-primary)",
            flex: 1,
          }}
        >
          {list.name}
        </p>
      </div>
    </motion.div>
  );
};
