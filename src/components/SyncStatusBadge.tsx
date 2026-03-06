import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useSync } from "../context/SyncContext";

export const SyncStatusBadge: React.FC = () => {
  const { status, lastResult } = useSync();

  const getStatusConfig = () => {
    switch (status) {
      case "syncing":
        return {
          icon: Loader2,
          text: "", // Compact
          color: "var(--primary)",
          bgColor: "var(--primary-15)",
          spin: true,
        };
      case "success":
        return {
          icon: CheckCircle2,
          text: "", // Compact
          color: "var(--success)",
          bgColor: "var(--success-15)",
          spin: false,
        };
      case "error":
        return {
          icon: AlertCircle,
          text: "", // Compact
          color: "var(--error)",
          bgColor: "var(--error-15)",
          spin: false,
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  const Icon = config.icon;
  const lastTime = lastResult?.timestamp
    ? lastResult.timestamp.toLocaleTimeString()
    : "";
  const errorCount = lastResult?.errors.length || 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        data-testid="sync-status"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          background: config.bgColor,
          border: `1px solid ${config.color}33`,
          color: config.color,
          cursor: "help",
        }}
        title={
          status === "error"
            ? `Ошибок: ${errorCount}. Нажмите для подробностей в настройках.`
            : lastTime
              ? `Последняя синхронизация: ${lastTime}`
              : "Синхронизация..."
        }
      >
        <motion.div
          animate={config.spin ? { rotate: 360 } : {}}
          transition={
            config.spin ? { duration: 1, repeat: Infinity, ease: "linear" } : {}
          }
        >
          <Icon size={16} />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
