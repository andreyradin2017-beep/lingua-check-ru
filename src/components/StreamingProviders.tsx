import React from "react";
import { motion } from "framer-motion";

interface Provider {
  name: string;
  logo: string;
  url?: string;
}

interface StreamingProvidersProps {
  providers: Provider[];
  title?: string;
}

export const StreamingProviders: React.FC<StreamingProvidersProps> = ({
  providers,
  title = "Смотреть онлайн",
}) => {
  if (!providers || providers.length === 0) return null;

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
        {title}
      </h3>
      <div
        className="hide-scrollbar"
        style={{
          display: "flex",
          overflowX: "auto",
          gap: "0.75rem",
          paddingBottom: "1rem",
          margin: "0 -1rem",
          padding: "0 1rem 1rem 1rem",
          scrollbarWidth: "none",
        }}
      >
        {providers.map((p, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => p.url && window.open(p.url, "_blank")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "var(--surface-hover)",
              padding: "0.5rem 0.75rem",
              borderRadius: "12px",
              cursor: p.url ? "pointer" : "default",
              border: "1px solid rgba(255,255,255,0.05)",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                overflow: "hidden",
                background: "var(--bg-card)",
              }}
            >
              <img
                src={p.logo}
                alt={p.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                loading="lazy"
              />
            </div>
            <span
              style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                whiteSpace: "nowrap",
              }}
            >
              {p.name}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
