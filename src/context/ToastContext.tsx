import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, X, Info } from "lucide-react";
import { notificationOccurred } from "../utils/haptics";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Trigger haptic feedback based on type
    if (type === "success") notificationOccurred("success");
    else if (type === "error") notificationOccurred("error");
    else notificationOccurred("warning");

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        id="toast-container"
        style={{
          position: "fixed",
          top: "1rem", // Show at top
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          pointerEvents: "none", // Allow clicks through container
          width: "90%",
          maxWidth: "400px",
        }}
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              className={`toast-message toast-${toast.type}`}
              data-type={toast.type}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              layout
              style={{
                pointerEvents: "auto",
                background: "rgba(20, 20, 20, 0.9)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.1)",
                padding: "0.75rem 1rem",
                borderRadius: "var(--radius-full)",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                color: "white",
              }}
            >
              {toast.type === "success" && (
                <CheckCircle2 size={18} color="var(--success)" />
              )}
              {toast.type === "error" && (
                <AlertCircle size={18} color="var(--error)" />
              )}
              {toast.type === "info" && (
                <Info size={18} color="var(--primary)" />
              )}
              <span style={{ fontSize: "0.9rem", fontWeight: 500, flex: 1 }}>
                {toast.message}
              </span>
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-tertiary)",
                  cursor: "pointer",
                  display: "flex",
                  padding: "4px",
                }}
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
