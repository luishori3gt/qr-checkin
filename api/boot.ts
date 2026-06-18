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

  // 1. Serve index.html for all HTML routes with NO-CACHE
  const htmlRoutes = ["/", "/login", "/dashboard", "/escaner", "/personas", "/transportistas", "/historial", "/equipo"];
  for (const route of htmlRoutes) {
    app.get(route, (c) => {
      const content = fs.readFileSync(path.join(distPath, "index.html"), "utf-8");
      c.header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      c.header("Pragma", "no-cache");
      c.header("Expires", "0");
      return c.html(content);
    });
  }

  // 2. Serve versioned assets from /app-*/ path
  app.use("/app-:version/*", async (c) => {
    const reqPath = c.req.path;
    // Extract the path after /app-xxx/
    const assetPath = reqPath.replace(/\/app-[^/]+\//, "");
    const filePath = path.join(distPath, assetPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      const mimeTypes: Record<string, string> = {
        ".js": "application/javascript",
        ".css": "text/css",
        ".svg": "image/svg+xml",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".ico": "image/x-icon",
        ".woff2": "font/woff2",
      };
      const contentType = mimeTypes[ext] || "application/octet-stream";
      const content = fs.readFileSync(filePath);
      c.header("Content-Type", contentType);
      c.header("Cache-Control", "no-store, no-cache, must-revalidate");
      return c.body(content);
    }
    return c.notFound();
  });

  // 3. SPA fallback
  app.notFound((c) => {
    const accept = c.req.header("accept") ?? "";
    if (accept.includes("text/html")) {
      return c.redirect("/dashboard");
    }
    return c.json({ error: "Not Found" }, 404);
  });

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
