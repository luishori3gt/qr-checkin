import * as cookie from "cookie";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { localUsers } from "@db/schema";
import { eq } from "drizzle-orm";
import { verify } from "./lib/jwt";
import { authenticateRequest } from "./kimi/auth";

export const authRouter = createRouter({
  me: authedQuery.query((opts) => opts.ctx.user),

  // Public endpoint to check session (OAuth or local)
  check: publicQuery.query(async ({ ctx }) => {
    // 1. Check OAuth
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
      // OAuth not available
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
  logout: authedQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: 0,
      }),
    );
    return { success: true };
  }),
});
