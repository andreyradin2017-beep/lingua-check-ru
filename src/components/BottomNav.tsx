import React from "react";
import { NavLink } from "react-router-dom";
import { Home, LayoutGrid, Settings, Plus, List } from "lucide-react";
import { selectionChanged } from "../utils/haptics";
import { cn } from "@/lib/utils";

export const BottomNav: React.FC = () => {
  const navItems = [
    { path: "/", icon: <Home className="w-[22px] h-[22px]" />, label: "Главная" },
    { path: "/discover", icon: <LayoutGrid className="w-[22px] h-[22px]" />, label: "Категории" },
    { path: "/search", icon: <Plus className="w-[28px] h-[28px]" />, label: "Поиск", isSpecial: true },
    { path: "/list", icon: <List className="w-[22px] h-[22px]" />, label: "Списки" },
    { path: "/settings", icon: <Settings className="w-[22px] h-[22px]" />, label: "Настройки" },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm h-[72px] bg-[#1A1A1A]/95 backdrop-blur-2xl rounded-[2rem] flex justify-around items-center z-[1000] shadow-2xl px-2">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={() => selectionChanged()}
          className={({ isActive }) =>
            cn(
              "relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-300",
              item.isSpecial ? "-translate-y-4" : "",
              isActive && !item.isSpecial ? "text-primary" : "text-zinc-500 hover:text-zinc-400"
            )
          }
        >
          {({ isActive }) => (
            item.isSpecial ? (
              <div className={cn(
                "w-[56px] h-[56px] rounded-full flex items-center justify-center text-black mb-1 transition-transform",
                isActive 
                  ? "bg-white shadow-[0_4px_20px_rgba(255,255,255,0.4)] scale-110" 
                  : "bg-yellow-400 shadow-[0_4px_20px_rgba(250,204,21,0.5)] hover:scale-105 active:scale-95"
              )}>
                {item.icon}
              </div>
            ) : (
              <>
                <div
                  className={cn(
                    "flex items-center justify-center transition-transform duration-300",
                    isActive ? "scale-110 -translate-y-0.5 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" : ""
                  )}
                >
                  {/* Clone element to fill when active if it's Heart, etc */}
                  {React.cloneElement(item.icon as React.ReactElement, {})}

                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium tracking-wide transition-all duration-300",
                    isActive ? "opacity-100 text-primary" : "opacity-70"
                  )}
                >
                  {item.label}
                </span>
              </>
            )
          )}
        </NavLink>
      ))}
    </nav>
  );
};
