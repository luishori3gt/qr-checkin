import { z } from "zod";
import bcrypt from "bcryptjs";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { localUsers } from "@db/schema";
import { eq } from "drizzle-orm";
import { sign, verify } from "./lib/jwt";

const LOCAL_AUTH_COOKIE = "local_auth_token";

// Helper to set cookie
function setLocalAuthCookie(token: string, headers: Headers) {
  headers.append(
    "set-cookie",
    `${LOCAL_AUTH_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}` // 30 days
  );
}

// Helper to clear cookie
function clearLocalAuthCookie(headers: Headers) {
  headers.append(
    "set-cookie",
    `${LOCAL_AUTH_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
}

export const localAuthRouter = createRouter({
  // Register a new local user
  register: publicQuery
    .input(
      z.object({
        username: z.string().min(3).max(100),
        password: z.string().min(4).max(100),
        nombre: z.string().min(1).max(255),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      // Check if username already exists
      const existing = await db
        .select()
        .from(localUsers)
        .where(eq(localUsers.username, input.username));

      if (existing.length > 0) {
        throw new Error("Este usuario ya existe");
      }

      // Hash password
      const passwordHash = await bcrypt.hash(input.password, 10);

      // Create user
      const result = await db.insert(localUsers).values({
        username: input.username,
        passwordHash,
        nombre: input.nombre,
        email: input.email,
      });

      const userId = Number(result[0].insertId);

      // Generate token
      const token = await sign({ userId, type: "local" });
      setLocalAuthCookie(token, ctx.resHeaders);

      return {
        success: true,
        user: {
          id: userId,
          username: input.username,
          name: input.nombre,
          nombre: input.nombre,
          role: "user",
        },
      };
    }),

  // Login with username/password
  login: publicQuery
    .input(
      z.object({
        username: z.string().min(1),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      // Find user by username
      const users = await db
        .select()
        .from(localUsers)
        .where(eq(localUsers.username, input.username));

      if (users.length === 0) {
        throw new Error("Usuario o contraseña incorrectos");
      }

      const user = users[0];

      // Check if user is active
      if (user.activo === "no") {
        throw new Error("Este usuario està inactivo");
      }

      // Verify password
      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new Error("Usuario o contraseña incorrectos");
      }

      // Update last sign in
      await db
        .update(localUsers)
        .set({ lastSignInAt: new Date() })
        .where(eq(localUsers.id, user.id));

      // Generate token
      const token = await sign({ userId: user.id, type: "local" });
      setLocalAuthCookie(token, ctx.resHeaders);

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.nombre,
          nombre: user.nombre,
          role: user.role,
        },
      };
    }),

  // Get current local user from token
  me: publicQuery.query(async ({ ctx }) => {
    const cookieHeader = ctx.req.headers.get("cookie");
    if (!cookieHeader) return null;

    const match = cookieHeader.match(/local_auth_token=([^;]+)/);
    if (!match) return null;

    try {
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
          createdAt: localUsers.createdAt,
          lastSignInAt: localUsers.lastSignInAt,
        })
        .from(localUsers)
        .where(eq(localUsers.id, Number(payload.userId)));

      if (users.length === 0 || users[0].activo === "no") return null;

      const u = users[0];
      return {
        id: u.id,
        username: u.username,
        name: u.nombre,
        nombre: u.nombre,
        email: u.email,
        role: u.role,
        avatar: null,
        lastSignInAt: u.lastSignInAt,
        createdAt: u.createdAt,
        authType: "local" as const,
      };
    } catch {
      return null;
    }
  }),

  // Logout
  logout: publicQuery.mutation(async ({ ctx }) => {
    clearLocalAuthCookie(ctx.resHeaders);
    return { success: true };
  }),

  // List all local users (for team management)
  list: publicQuery.query(async () => {
    const db = getDb();
    return db
      .select({
        id: localUsers.id,
        username: localUsers.username,
        nombre: localUsers.nombre,
        email: localUsers.email,
        role: localUsers.role,
        activo: localUsers.activo,
        createdAt: localUsers.createdAt,
        lastSignInAt: localUsers.lastSignInAt,
      })
      .from(localUsers)
      .orderBy(localUsers.nombre);
  }),

  // Toggle user active status
  toggleActive: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const users = await db
        .select({ activo: localUsers.activo })
        .from(localUsers)
        .where(eq(localUsers.id, input.id));

      if (users.length === 0) throw new Error("Usuario no encontrado");

      const newStatus = users[0].activo === "si" ? "no" : "si";
      await db
        .update(localUsers)
        .set({ activo: newStatus })
        .where(eq(localUsers.id, input.id));

      return { success: true, activo: newStatus };
    }),
});
