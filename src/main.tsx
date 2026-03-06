import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import "./index.css";
// App is no longer needed here as it is used within the router configuration,
// or if we kept providers in App, we'd import App. But here we moved providers to main or left them.
// Wait, based on my previous step I put providers in main.tsx.
// Let's check router.tsx again. Layout uses Outlet.
// I need to be careful. In router.tsx I used <Layout /> as the root element.
// Layout contains <Outlet />.
// Where is <App /> used?
// Original App.tsx had <Routes>. Now router.tsx defines routes.
// The `OfflineIndicator` and `useSearchProviders` logic was in App.tsx. I should move that logic to a root layout wrapper or keep App as the root element in router.
import { ToastProvider } from "./context/ToastContext.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { SyncProvider } from "./context/SyncContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <SyncProvider>
          <RouterProvider router={router} />
        </SyncProvider>
      </AuthProvider>
    </ToastProvider>
  </StrictMode>,
);
