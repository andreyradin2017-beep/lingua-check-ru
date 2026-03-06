import React from "react";
import { BentoTile } from "./BentoTile";

interface DetailDescriptionProps {
  description: string;
  delay?: number;
}

export const DetailDescription: React.FC<DetailDescriptionProps> = ({
  description,
  delay = 0.15,
}) => {
  return (
    <BentoTile colSpan={2} delay={delay} style={{ padding: "1.25rem" }}>
      <label className="section-label" style={{ marginBottom: "0.5rem" }}>
        Об инструменте / Сюжет
      </label>
      <p
        style={{
          fontSize: "0.9rem",
          lineHeight: "1.6",
          color: "var(--text-secondary)",
          margin: 0,
          whiteSpace: "pre-wrap",
        }}
      >
        {description}
      </p>
    </BentoTile>
  );
};
