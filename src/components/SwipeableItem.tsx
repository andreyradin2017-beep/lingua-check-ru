import React from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useGesture } from "@use-gesture/react";
import { Archive, Check } from "lucide-react";

interface SwipeableItemProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void; // Archive
  onSwipeRight?: () => void; // Complete
  threshold?: number;
}

export const SwipeableItem: React.FC<SwipeableItemProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  threshold = 80,
}) => {
  const x = useMotionValue(0);

  // Динамические цвета для фона при свайпе
  const background = useTransform(
    x,
    [-threshold, 0, threshold],
    ["var(--warning)", "rgba(255,255,255,0.05)", "var(--success)"],
  );

  // Масштабирование иконок
  const leftIconScale = useTransform(x, [0, threshold], [0.5, 1.2]);
  const rightIconScale = useTransform(x, [-threshold, 0], [1.2, 0.5]);

  const bind = useGesture(
    {
      onDrag: ({
        offset: [ox],
        active,
      }: {
        offset: [number, number];
        active: boolean;
      }) => {
        if (active) {
          x.set(ox);
        }
      },
      onDragEnd: ({ offset: [ox] }: { offset: [number, number] }) => {
        if (ox > threshold) {
          onSwipeRight?.();
        } else if (ox < -threshold) {
          onSwipeLeft?.();
        }
        // Возвращаем в исходное положение с анимацией
        x.set(0);
      },
    } as any, // Temporary fix for gesture types until package is properly installed
    {
      drag: {
        axis: "x",
        bounds: { left: -threshold - 20, right: threshold + 20 },
        rubberband: true,
      },
    },
  );

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "var(--radius-md)",
        marginBottom: "0.75rem",
      }}
    >
      {/* Фоновые иконки действий */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.5rem",
          background,
          zIndex: 0,
        }}
      >
        <motion.div style={{ scale: leftIconScale, color: "white" }}>
          <Check size={24} />
        </motion.div>
        <motion.div style={{ scale: rightIconScale, color: "white" }}>
          <Archive size={24} />
        </motion.div>
      </motion.div>

      {/* Контент карточки */}
      <div {...bind()} style={{ touchAction: "none" }}>
        <motion.div style={{ x, position: "relative", zIndex: 1 }}>
          {children}
        </motion.div>
      </div>
    </div>
  );
};
