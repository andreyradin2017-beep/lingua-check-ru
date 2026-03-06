import React, { useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface LivingIconProps {
  icon: LucideIcon;
  size?: number;
  color?: string;
  active?: boolean;
  animation?: "draw" | "pop" | "pulse" | "none";
  trigger?: any; // Value that triggers animation when changed
}

export const LivingIcon: React.FC<LivingIconProps> = ({
  icon: Icon,
  size = 24,
  color = "currentColor",
  active = false,
  animation = "pop",
  trigger,
}) => {
  const controls = useAnimation();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;

    const animate = async () => {
      if (animation === "pop") {
        await controls.start({
          scale: 1.2,
          rotate: 15,
          transition: { duration: 0.1 },
        });
        await controls.start({
          scale: 1,
          rotate: 0,
          transition: { type: "spring", stiffness: 300, damping: 10 },
        });
      } else if (animation === "draw") {
        await controls.start({
          pathLength: 0,
          opacity: 0,
          transition: { duration: 0 },
        });
        await controls.start({
          pathLength: 1,
          opacity: 1,
          transition: { duration: 0.5, ease: "easeInOut" },
        });
      } else if (animation === "pulse") {
        await controls.start({
          scale: [1, 1.1, 1],
          transition: { repeat: Infinity, duration: 1.5 },
        });
      }
    };

    animate();
  }, [trigger, active, animation, controls, hasMounted]);

  // Framer Motion 'motion.create' pattern for custom components is complex with Lucide
  // Instead, we animate a wrapper div

  return (
    <motion.div
      animate={controls}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: active ? color : "var(--text-tertiary)",
      }}
    >
      <Icon size={size} color={color} />
    </motion.div>
  );
};
