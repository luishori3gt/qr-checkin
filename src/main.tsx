import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import { TRPCProvider } from "@/providers/trpc";
import { Toaster } from "@/components/ui/sonner";
import App from "./App.tsx";

// Cache-bust: 2025-06-18T22:00:00Z
// Version: public-no-login-v3

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <TRPCProvider>
        <App />
        <Toaster position="top-right" richColors />
      </TRPCProvider>
    </BrowserRouter>
  </StrictMode>
);
