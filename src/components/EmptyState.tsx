import React from "react";
import { motion } from "framer-motion";
import { Ghost } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  message?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message = "Здесь пока ничего нет",
  icon,
  action,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center py-12 px-6 text-center text-zinc-400 min-h-[260px] relative overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-500/20 blur-[80px] -z-10" />

      <div className="relative z-10 bg-white/5 p-7 rounded-[30%_70%_70%_30%/30%_30%_70%_70%] mb-6 border border-white/5 flex items-center justify-center text-primary shadow-xl">
        {icon || <Ghost size={48} strokeWidth={1.5} />}
      </div>

      <p className="relative z-10 text-lg font-bold text-zinc-100 mb-2">
        {message}
      </p>

      <p className="relative z-10 text-base font-medium text-zinc-400 max-w-[260px] leading-relaxed mb-8">
        {action
          ? "Здесь будет отображаться ваш контент, начните с добавления первого элемента"
          : "Попробуйте изменить параметры поиска или фильтры"}
      </p>

      {action && (
        <Button
          onClick={action.onClick}
          className="relative z-10 rounded-full font-bold px-8 py-6 h-auto text-base bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black shadow-[0_0_20px_rgba(251,191,36,0.3)] border-none transition-all hover:scale-105 active:scale-95"
        >
          {action.label}
        </Button>
      )}
    </motion.div>
  );
};
