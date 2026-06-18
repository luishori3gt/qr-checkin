import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { Paths } from "@contracts/constants";
import fs from "fs";
import path from "path";

const app = new Hono<{ Bindings: HttpBindings }>();
const __dirname = import.meta.dirname || path.dirname(new URL(import.meta.url).pathname);
const distPath = path.resolve(__dirname, "../dist/public");

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
app.get(Paths.oauthCallback, createOAuthCallbackHandler());
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

// SPA: Serve index.html for ALL non-API, non-asset routes
// This must be before static file serving
app.get("*", async (c, next) => {
  const reqPath = c.req.path;
  
  // Skip API routes (already handled)
  if (reqPath.startsWith("/api/")) return next();
  
  // Skip actual file requests (assets, etc.)
  if (reqPath.includes(".")) return next();
  
  // Serve index.html for all SPA routes
  try {
    const indexPath = path.join(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      let content = fs.readFileSync(indexPath, "utf-8");
      c.header("Cache-Control", "no-store, no-cache, must-revalidate");
      return c.html(content);
    }
  } catch {
    // Fall through
  }
  return next();
});

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
