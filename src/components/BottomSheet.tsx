import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  // Блокировка скролла body при открытом BottomSheet
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
              zIndex: 1000,
            }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) {
                onClose();
              }
            }}
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              maxHeight: "90vh",
              background: "var(--bg-app)",
              borderTop: "1px solid rgba(255,255,255,0.1)",
              borderTopLeftRadius: "24px",
              borderTopRightRadius: "24px",
              zIndex: 1001,
              padding: "1rem",
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 2rem)",
              boxShadow: "0 -10px 40px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Drag Handle */}
            <div
              style={{
                width: "40px",
                height: "4px",
                background: "rgba(255,255,255,0.2)",
                borderRadius: "2px",
                margin: "0 auto 1rem",
              }}
            />

            {title && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.5rem",
                  padding: "0 0.5rem",
                }}
              >
                <h3 style={{ margin: 0, fontSize: "1.25rem" }}>{title}</h3>
                <button
                  onClick={onClose}
                  style={{ minWidth: 32, minHeight: 32 }}
                >
                  <X size={20} />
                </button>
              </div>
            )}

            <div style={{ overflowY: "auto", flex: 1 }}>{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
