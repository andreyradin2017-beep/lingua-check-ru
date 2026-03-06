import React from "react";
import { ArrowLeft, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SyncStatusBadge } from "./SyncStatusBadge";
import { useAuth } from "../context/AuthContext";

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  leftElement?: React.ReactNode;
  style?: React.CSSProperties;
  titleClassName?: string;
  showSyncStatus?: boolean; // New prop
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  showBack,
  onBack,
  rightElement,
  leftElement,
  style,
  titleClassName = "",
  showSyncStatus = true, // Default to true
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div
      className="flex justify-between items-center sticky top-0 z-50 bg-black/80 backdrop-blur-xl px-4 py-3 -mx-4 mb-5 border-b border-white/5"
      style={style}
    >
      <div
        className="flex items-center gap-3"
      >
        {leftElement && leftElement}
        {showBack && (
          <button
            onClick={onBack || (() => navigate(-1))}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Назад"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <h1
          className={titleClassName}
          style={{
            fontSize: "1.1rem",
            fontWeight: "var(--fw-black)",
            margin: 0,
            letterSpacing: "-0.5px",
            color: "var(--text-primary)",
            fontFamily: "var(--font-main)",
            lineHeight: 1,
          }}
        >
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        {showSyncStatus && user && <SyncStatusBadge />}
        {rightElement}
        {!rightElement && !showBack && (
          <div
            onClick={() => navigate("/settings")}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-white/20 transition-colors border border-white/10"
          >
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={16} className="text-white" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
