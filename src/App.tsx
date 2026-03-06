import { OfflineIndicator } from "@components/OfflineIndicator";
import { useSearchProviders } from "@hooks/useSearchProviders";
import { Outlet, ScrollRestoration } from "react-router-dom";
import { useState, useEffect } from "react";
import { SplashScreen } from "@components/SplashScreen";
import { getDiscoverData } from "@services/discover";
import { db } from "@db/db";

function App() {
  const [initialized, setInitialized] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Initialize search providers on first load
  useSearchProviders();

  useEffect(() => {
    const minSplashTime = 2000; // Exact 2 seconds per user request
    const startTime = Date.now();

    // Fire off background requests to warm up caches
    const prefetchData = async () => {
      try {
        await Promise.allSettled([
          getDiscoverData(),
          db.items.toArray()
        ]);
        setInitialized(true);
      } catch (e) {
        console.error("Prefetch failed", e);
        setInitialized(true); // Still initialize even if prefetch fails
      }
    };

    prefetchData();

    // Hide splash screen after exactly 2 seconds
    const checkSplashTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= minSplashTime) {
        setShowSplash(false);
        clearInterval(checkSplashTimer);
      }
    }, 100);

    return () => clearInterval(checkSplashTimer);
  }, []);

  return (
    <>
      <SplashScreen isVisible={showSplash} />
      {(!showSplash && initialized) && (
        <>
          <OfflineIndicator />
          <ScrollRestoration />
          <Outlet />
        </>
      )}
    </>
  );
}

export default App;
