import React from "react";
import { motion } from "framer-motion";

interface GenreData {
  name: string;
  count: number;
}

interface StatsBarChartProps {
  data: GenreData[];
  maxCount: number;
}

export const StatsBarChart: React.FC<StatsBarChartProps> = ({
  data,
  maxCount,
}) => {
  const total = data.reduce((acc, item) => acc + item.count, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {data.map((item, i) => {
        const barWidth = maxCount ? (item.count / maxCount) * 100 : 0;
        const itemPercentage = total
          ? Math.round((item.count / total) * 100)
          : 0;

        return (
          <div
            key={item.name}
            style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.8rem",
              }}
            >
              <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                {item.name}
              </span>
              <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>
                {itemPercentage}%
              </span>
            </div>

            <div
              style={{
                height: "8px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${barWidth}%` }}
                transition={{
                  delay: 0.8 + i * 0.1,
                  duration: 1,
                  ease: "circOut",
                }}
                style={{
                  height: "100%",
                  background: `linear-gradient(90deg, var(--primary) 0%, #a78bfa 100%)`,
                  borderRadius: "4px",
                  boxShadow: "0 0 10px rgba(139, 92, 246, 0.3)",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
