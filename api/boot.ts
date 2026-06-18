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
  const { serveStatic } = await import("@hono/node-server/serve-static");
  const fs = await import("fs");
  const path = await import("path");

  const distPath = path.resolve(import.meta.dirname, "../dist/public");

  // 1. Serve index.html with NO-CACHE headers for all SPA routes
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

  // 2. Serve static assets (JS/CSS) with aggressive no-cache
  app.use("/assets/*", async (c, next) => {
    await next();
    c.header("Cache-Control", "no-store, no-cache, must-revalidate");
  });
  app.use("/assets/*", serveStatic({ root: "./dist/public" }));

  // 3. SPA fallback — redirect unknown routes to dashboard
  app.notFound((c) => {
    const accept = c.req.header("accept") ?? "";
    if (!accept.includes("text/html")) {
      return c.json({ error: "Not Found" }, 404);
    }
    return c.redirect("/dashboard");
  });

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
