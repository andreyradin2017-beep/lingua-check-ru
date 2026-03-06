import React, { useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { vibrate, notificationOccurred } from "../utils/haptics";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
}) => {
  const [startY, setStartY] = useState(0);
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const controls = useAnimation();
  const threshold = 80;

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        setStartY(e.touches[0].clientY);
        setPulling(true);
      }
    };

    const handleTouchMove = async (e: TouchEvent) => {
      if (!pulling) return;
      const currentY = e.touches[0].clientY;
      const delta = currentY - startY;

      if (delta > 0 && window.scrollY === 0) {
        // e.preventDefault(); // Prevent native pull-to-refresh if possible
        await controls.start({ y: Math.min(delta * 0.5, threshold * 1.5) });
      }
    };

    const handleTouchEnd = async (e: TouchEvent) => {
      if (!pulling) return;
      const currentY = e.changedTouches[0].clientY;
      const delta = currentY - startY;

      if (delta > threshold && window.scrollY === 0) {
        setRefreshing(true);
        vibrate("medium");
        await controls.start({ y: threshold });
        await onRefresh();
        setRefreshing(false);
        notificationOccurred("success");
      }

      await controls.start({ y: 0 });
      setPulling(false);
    };

    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pulling, startY, refreshing, controls, onRefresh, threshold]);

  return (
    <>
      <motion.div
        animate={controls}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 0, // Hidden by default, expands on pull
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            background: "var(--bg-surface)",
            borderRadius: "50%",
            padding: "0.8rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "-40px", // Center inside the pulled area
          }}
        >
          <motion.div
            animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
            transition={{
              repeat: refreshing ? Infinity : 0,
              duration: 1,
              ease: "linear",
            }}
          >
            <RefreshCw size={20} color="var(--primary)" />
          </motion.div>
        </div>
      </motion.div>
      {children}
    </>
  );
};
