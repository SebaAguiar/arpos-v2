import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppThemeProvider } from "@/lib/theme";
import { TauriShell } from "@/components/layout/TauriShell";
import { App } from "@/App";
import { resolveBackendConfig } from "@/config";
import "@/styles/globals.css";

async function bootstrap(): Promise<void> {
  // In the desktop build the launcher publishes the sidecar's ephemeral port
  // and token over IPC; resolve them before the first API call fires.
  await resolveBackendConfig();
}

function render(): void {
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
}

void bootstrap().then(render);