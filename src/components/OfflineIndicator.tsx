import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff } from "lucide-react";

export const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          style={{
            position: "fixed",
            bottom: "5.5rem", // Above bottom nav
            left: "1rem",
            right: "1rem",
            background: "var(--error)",
            color: "white",
            padding: "0.75rem",
            borderRadius: "var(--radius-lg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            boxShadow: "0 4px 12px rgba(239, 68, 68, 0.4)",
            zIndex: 1000,
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          <WifiOff size={16} />
          <span>Нет подключения к интернету</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
