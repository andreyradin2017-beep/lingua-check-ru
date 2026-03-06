import React from "react";
import { motion } from "framer-motion";
import { User } from "lucide-react";

interface CastScrollProps {
  cast: {
    name: string;
    character?: string;
    image?: string;
  }[];
  onActorClick?: (name: string) => void;
}

export const CastScroll: React.FC<CastScrollProps> = ({
  cast,
  onActorClick,
}) => {
  if (!cast || cast.length === 0) return null;

  return (
    <div style={{ margin: "var(--space-md) 0" }}>
      <h3
        style={{
          fontSize: "1rem",
          fontWeight: 700,
          marginBottom: "0.75rem",
          color: "var(--text-primary)",
        }}
      >
        В ролях
      </h3>
      <div
        className="hide-scrollbar"
        style={{
          display: "flex",
          overflowX: "auto",
          gap: "1rem",
          paddingBottom: "1rem",
          margin: "0 -1rem",
          padding: "0 1rem 1rem 1rem",
          scrollbarWidth: "none",
        }}
      >
        {cast.map((actor, idx) => (
          <motion.div
            key={idx}
            whileTap={{ scale: 0.95 }}
            onClick={() => onActorClick && onActorClick(actor.name)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.5rem",
              minWidth: "80px",
              maxWidth: "90px",
              cursor: onActorClick ? "pointer" : "default",
            }}
          >
            <div
              style={{
                width: "70px",
                height: "70px",
                borderRadius: "50%",
                background: "var(--surface-hover)",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            >
              {actor.image ? (
                <img
                  src={actor.image}
                  alt={actor.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  loading="lazy"
                />
              ) : (
                <User size={24} color="var(--text-muted)" />
              )}
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  width: "90px",
                }}
                title={actor.name}
              >
                {actor.name}
              </div>
              {actor.character && (
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--text-secondary)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    width: "90px",
                    marginTop: "2px",
                  }}
                  title={actor.character}
                >
                  {actor.character}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
