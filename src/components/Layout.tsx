import React from "react";
import { Outlet } from "react-router-dom";
import { ScrollToTop } from "./ScrollToTop";
import { BottomNav } from "./BottomNav";
import { ScrollProgress } from "./ScrollProgress";

export const Layout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-black relative w-full pb-40 text-white">
      <ScrollProgress />
      <ScrollToTop />
      <main className="flex-1 w-full max-w-[398px] mx-auto px-4">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
};
