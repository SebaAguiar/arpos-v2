import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppThemeProvider } from "@/lib/theme";
import { TauriShell } from "@/components/layout/TauriShell";
import { App } from "@/App";
import "@/styles/globals.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <TauriShell>
      <BrowserRouter>
        <AppThemeProvider>
          <App />
        </AppThemeProvider>
      </BrowserRouter>
    </TauriShell>
  </StrictMode>,
);
