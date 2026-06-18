import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { Paths } from "@contracts/constants";

const app = new Hono<{ Bindings: HttpBindings }>();

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

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const fs = await import("fs");
  const path = await import("path");

  const distPath = path.resolve(import.meta.dirname, "../dist/public");

  // 1. Serve index.html with NO-CACHE for all SPA routes (BEFORE static files)
  const htmlRoutes = ["/", "/login", "/dashboard", "/escaner", "/personas", "/transportistas", "/historial", "/equipo", "/qr/:id"];
  for (const route of htmlRoutes) {
    app.get(route, (c) => {
      const content = fs.readFileSync(path.join(distPath, "index.html"), "utf-8");
      c.header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      c.header("Pragma", "no-cache");
      c.header("Expires", "0");
      return c.html(content);
    });
  }

  // 2. Serve ALL static files (including versioned assets) with no-cache
  app.use("/*", async (c, next) => {
    // Skip HTML routes (already handled above)
    const reqPath = c.req.path;
    if (htmlRoutes.some(r => reqPath === r || (r.includes(":") && reqPath.startsWith(r.split(":")[0])))) {
      return next();
    }
    
    // Try to serve as static file
    const filePath = path.join(distPath, reqPath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      const mimeTypes: Record<string, string> = {
        ".js": "application/javascript",
        ".css": "text/css",
        ".svg": "image/svg+xml",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".ico": "image/x-icon",
      };
      const contentType = mimeTypes[ext] || "application/octet-stream";
      const content = fs.readFileSync(filePath);
      c.header("Content-Type", contentType);
      c.header("Cache-Control", "no-store, no-cache, must-revalidate");
      return c.body(content);
    }
    return next();
  });

  // 3. SPA fallback
  app.notFound((c) => {
    return c.redirect("/dashboard");
  });

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
