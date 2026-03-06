import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// -- Confirm Dialog --
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = "Да",
  cancelLabel = "Отмена",
  confirmColor = "var(--error)",
  onConfirm,
  onCancel,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1.5rem",
          }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-surface)",
              border: "var(--border-glass)",
              borderRadius: "var(--radius-xl)",
              padding: "1.75rem",
              width: "100%",
              maxWidth: "340px",
              textAlign: "center",
              boxShadow: "0 25px 60px -15px rgba(0,0,0,0.5)",
            }}
          >
            <h3
              style={{
                margin: "0 0 0.5rem 0",
                fontSize: "1.1rem",
                fontWeight: 800,
                color: "var(--text-primary)",
              }}
            >
              {title}
            </h3>
            {message && (
              <p
                style={{
                  margin: "0 0 1.5rem 0",
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                }}
              >
                {message}
              </p>
            )}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={onCancel}
                style={{
                  flex: 1,
                  padding: "0.85rem",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.05)",
                  color: "var(--text-secondary)",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                style={{
                  flex: 1,
                  padding: "0.85rem",
                  borderRadius: "var(--radius-lg)",
                  border: "none",
                  background: confirmColor,
                  color: "white",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// -- Input Dialog (replaces prompt()) --
interface InputDialogProps {
  isOpen: boolean;
  title: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export const InputDialog: React.FC<InputDialogProps> = ({
  isOpen,
  title,
  placeholder = "",
  confirmLabel = "Создать",
  cancelLabel = "Отмена",
  onConfirm,
  onCancel,
}) => {
  const [value, setValue] = useState("");

  const handleConfirm = () => {
    if (value.trim()) {
      onConfirm(value.trim());
      setValue("");
    }
  };

  const handleCancel = () => {
    setValue("");
    onCancel();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleCancel}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1.5rem",
          }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-surface)",
              border: "var(--border-glass)",
              borderRadius: "var(--radius-xl)",
              padding: "1.75rem",
              width: "100%",
              maxWidth: "340px",
              boxShadow: "0 25px 60px -15px rgba(0,0,0,0.5)",
            }}
          >
            <h3
              style={{
                margin: "0 0 1rem 0",
                fontSize: "1.1rem",
                fontWeight: 800,
                color: "var(--text-primary)",
                textAlign: "center",
              }}
            >
              {title}
            </h3>
            <input
              type="text"
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              placeholder={placeholder}
              style={{
                width: "100%",
                padding: "0.85rem 1rem",
                borderRadius: "var(--radius-lg)",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(0,0,0,0.3)",
                color: "var(--text-primary)",
                fontSize: "0.95rem",
                fontWeight: 500,
                outline: "none",
                marginBottom: "1rem",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={handleCancel}
                style={{
                  flex: 1,
                  padding: "0.85rem",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.05)",
                  color: "var(--text-secondary)",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                {cancelLabel}
              </button>
              <button
                onClick={handleConfirm}
                style={{
                  flex: 1,
                  padding: "0.85rem",
                  borderRadius: "var(--radius-lg)",
                  border: "none",
                  background: "var(--primary-gradient)",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  opacity: value.trim() ? 1 : 0.5,
                }}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// -- Quick Action Menu (for long-press) --
interface QuickAction {
  label: string;
  icon?: React.ReactNode;
  color?: string;
  onClick: () => void;
}

interface QuickActionMenuProps {
  isOpen: boolean;
  title: string;
  actions: QuickAction[];
  onClose: () => void;
}

export const QuickActionMenu: React.FC<QuickActionMenuProps> = ({
  isOpen,
  title,
  actions,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-surface)",
              border: "var(--border-glass)",
              borderRadius: "var(--radius-xl)",
              padding: "1rem",
              width: "100%",
              maxWidth: "400px",
              marginBottom: "env(safe-area-inset-bottom, 0px)",
              boxShadow: "0 -10px 40px -10px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "4px",
                background: "rgba(255,255,255,0.2)",
                borderRadius: "2px",
                margin: "0 auto 0.75rem",
              }}
            />
            <h4
              style={{
                margin: "0 0 0.75rem 0.5rem",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--text-secondary)",
              }}
            >
              {title}
            </h4>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
              }}
            >
              {actions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => {
                    action.onClick();
                    onClose();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.85rem 0.75rem",
                    borderRadius: "var(--radius-lg)",
                    border: "none",
                    background: "transparent",
                    color: action.color || "var(--text-primary)",
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    cursor: "pointer",
                    width: "100%",
                    textAlign: "left",
                  }}
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              style={{
                width: "100%",
                padding: "0.85rem",
                borderRadius: "var(--radius-lg)",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.05)",
                color: "var(--text-secondary)",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
                marginTop: "0.5rem",
              }}
            >
              Отмена
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
