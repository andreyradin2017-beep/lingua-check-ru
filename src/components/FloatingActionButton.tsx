import React from "react";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { vibrate } from "@utils/haptics";
import { pressAnimation } from "@utils/animations";

export const FloatingActionButton: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide FAB on certain pages if needed, e.g. search page itself
  if (location.pathname === "/search") return null;

  const handleClick = () => {
    vibrate("medium");
    navigate("/search");
  };

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      {...pressAnimation}
      onClick={handleClick}
      style={{
        position: "fixed",
        right: "1.5rem",
        bottom: "6rem", // Above BottomNav
        width: "56px",
        height: "56px",
        borderRadius: "28px",
        background:
          "var(--primary-gradient, linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%))",
        color: "white",
        border: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 8px 32px rgba(139, 92, 246, 0.4)",
        zIndex: 50,
        cursor: "pointer",
        backdropFilter: "blur(8px)",
      }}
    >
      <Plus size={28} />
    </motion.button>
  );
};
