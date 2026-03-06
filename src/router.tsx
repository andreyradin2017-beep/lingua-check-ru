import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "@components/Layout";
import { ErrorBoundary } from "@components/ErrorBoundary";
import { PageLoader } from "@components/PageLoader";
import { Suspense, lazy } from "react";

/**
 * Wraps lazy() with automatic page reload on chunk load failure.
 * After a new Vercel deploy, old cached chunk hashes are invalid.
 * Uses a per-URL sessionStorage key so each stale chunk can trigger
 * its own reload without blocking other chunks.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): React.LazyExoticComponent<T> {
  return lazy(() =>
    factory().catch((err: unknown) => {
      // Extract URL from error message to key per-chunk, preventing loops
      const msg = err instanceof Error ? err.message : String(err);
      const urlMatch = msg.match(/https?:\/\/[^\s]+/);
      const key = urlMatch
        ? `chunk_reload_${urlMatch[0]}`
        : "chunk_reload_unknown";

      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
        // Return a never-resolving promise so React doesn't render broken UI
        return new Promise<never>(() => {});
      }
      throw err;
    }),
  );
}

// Lazy load pages
const Home = lazyWithRetry(() =>
  import("@pages/Home").then((module) => ({ default: module.Home })),
);
const Search = lazyWithRetry(() =>
  import("@pages/Search").then((module) => ({ default: module.Search })),
);
const ItemDetail = lazyWithRetry(() =>
  import("@pages/ItemDetail").then((module) => ({
    default: module.ItemDetail,
  })),
);
const ListPage = lazyWithRetry(() =>
  import("@pages/ListPage").then((module) => ({ default: module.ListPage })),
);
const ListIndex = lazyWithRetry(() =>
  import("@pages/ListIndex").then((module) => ({ default: module.ListIndex })),
);
const Random = lazyWithRetry(() =>
  import("@pages/Random").then((module) => ({ default: module.Random })),
);
const Settings = lazyWithRetry(() =>
  import("@pages/Settings").then((module) => ({ default: module.Settings })),
);
const Archive = lazyWithRetry(() =>
  import("@pages/Archive").then((module) => ({ default: module.Archive })),
);
const Discover = lazyWithRetry(() =>
  import("@pages/Discover").then((module) => ({ default: module.Discover })),
);

// Wrapper for Suspense to avoid repetition
const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

import App from "@/App";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: (
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    ),
    children: [
      {
        element: <Layout />,
        children: [
          {
            index: true,
            element: (
              <SuspenseWrapper>
                <Home />
              </SuspenseWrapper>
            ),
          },
          {
            path: "search",
            element: (
              <SuspenseWrapper>
                <Search />
              </SuspenseWrapper>
            ),
          },
          {
            path: "list",
            element: (
              <SuspenseWrapper>
                <ListIndex />
              </SuspenseWrapper>
            ),
          },
          {
            path: "list/:id",
            element: (
              <SuspenseWrapper>
                <ListPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: "item/:id",
            element: (
              <SuspenseWrapper>
                <ItemDetail />
              </SuspenseWrapper>
            ),
          },
          {
            path: "random",
            element: (
              <SuspenseWrapper>
                <Random />
              </SuspenseWrapper>
            ),
          },
          {
            path: "settings",
            element: (
              <SuspenseWrapper>
                <Settings />
              </SuspenseWrapper>
            ),
          },
          {
            path: "archive",
            element: (
              <SuspenseWrapper>
                <Archive />
              </SuspenseWrapper>
            ),
          },
          {
            path: "discover",
            element: (
              <SuspenseWrapper>
                <Discover />
              </SuspenseWrapper>
            ),
          },
          {
            path: "*",
            element: <Navigate to="/" replace />,
          },
        ],
      },
    ],
  },
]);
