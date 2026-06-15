import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { localUsers } from "@db/schema";
import { eq } from "drizzle-orm";
import { verify } from "./lib/jwt";
import { authenticateRequest } from "./kimi/auth";

export const sessionRouter = createRouter({
  // Single endpoint to check both OAuth and local auth
  me: publicQuery.query(async ({ ctx }) => {
    // 1. Check OAuth first
    try {
      const oauthUser = await authenticateRequest(ctx.req.headers);
      if (oauthUser) {
        return {
          id: oauthUser.id,
          name: oauthUser.name,
          email: oauthUser.email,
          avatar: oauthUser.avatar,
          role: oauthUser.role,
          authType: "oauth" as const,
        };
      }
    } catch {
      // OAuth not available, try local
    }

    // 2. Check local auth
    try {
      const cookieHeader = ctx.req.headers.get("cookie");
      if (!cookieHeader) return null;

      const match = cookieHeader.match(/local_auth_token=([^;]+)/);
      if (!match) return null;

      const payload = (await verify(match[1])) as Record<string, unknown> | null;
      if (!payload || typeof payload !== "object" || payload.type !== "local") {
        return null;
      }

      const db = getDb();
      const users = await db
        .select({
          id: localUsers.id,
          username: localUsers.username,
          nombre: localUsers.nombre,
          email: localUsers.email,
          role: localUsers.role,
          activo: localUsers.activo,
        })
        .from(localUsers)
        .where(eq(localUsers.id, Number(payload.userId)));

      if (users.length === 0 || users[0].activo === "no") return null;

      const u = users[0];
      return {
        id: u.id,
        name: u.nombre,
        email: u.email,
        avatar: null,
        role: u.role,
        authType: "local" as const,
      };
    } catch {
      return null;
    }
  }),
});
