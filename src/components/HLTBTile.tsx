import React from "react";
import { Timer } from "lucide-react";
import { BentoTile } from "./BentoTile";

interface HLTBTileProps {
  /** Legacy HLTB data (disabled, kept for type compatibility) */
  hltb?: { main: string; extra: string; completionist: string } | null;
  /** Average playtime in hours from RAWG */
  playtime?: number;
  delay?: number;
}

export const HLTBTile: React.FC<HLTBTileProps> = ({ playtime, delay = 0.18 }) => {
  if (!playtime) return null;

  return (
    <BentoTile colSpan={2} delay={delay} style={{ padding: "1rem" }}>
      <div
        className="flex-center"
        style={{
          justifyContent: "flex-start",
          gap: "0.5rem",
          marginBottom: "0.75rem",
        }}
      >
        <Timer size={14} color="var(--primary)" />
        <label className="section-label" style={{ margin: 0 }}>
          Среднее время прохождения
        </label>
      </div>
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          padding: "0.85rem 1rem",
          borderRadius: "12px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "0.6rem",
            color: "var(--text-tertiary)",
            marginBottom: "0.25rem",
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          По данным игрового сообщества
        </div>
        <div
          style={{
            fontSize: "1.4rem",
            fontWeight: 800,
            color: "var(--text-primary)",
          }}
        >
          ~{playtime}ч
        </div>
      </div>
    </BentoTile>
  );
};
