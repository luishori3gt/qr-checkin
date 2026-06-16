import { z } from "zod";
import bcrypt from "bcryptjs";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { localUsers } from "@db/schema";
import { eq } from "drizzle-orm";
import { sign, verify } from "./lib/jwt";

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
    .mutation(async ({ input }) => {
      const db = getDb();

      const existing = await db
        .select()
        .from(localUsers)
        .where(eq(localUsers.username, input.username));

      if (existing.length > 0) {
        throw new Error("Este usuario ya existe");
      }

      const passwordHash = await bcrypt.hash(input.password, 10);

      const result = await db.insert(localUsers).values({
        username: input.username,
        passwordHash,
        nombre: input.nombre,
        email: input.email,
      });

      const userId = Number(result[0].insertId);

      // Generate token and return it (frontend stores in localStorage)
      const token = await sign({ userId, type: "local" });

      return {
        success: true,
        token,
        user: {
          id: userId,
          username: input.username,
          name: input.nombre,
          role: "user",
        },
      };
    }),

  // Login with username/password - returns token in JSON
  login: publicQuery
    .input(
      z.object({
        username: z.string().min(1),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const users = await db
        .select()
        .from(localUsers)
        .where(eq(localUsers.username, input.username));

      if (users.length === 0) {
        throw new Error("Usuario o contrasena incorrectos");
      }

      const user = users[0];

      if (user.activo === "no") {
        throw new Error("Este usuario esta inactivo");
      }

      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new Error("Usuario o contrasena incorrectos");
      }

      // Update last sign in
      await db
        .update(localUsers)
        .set({ lastSignInAt: new Date() })
        .where(eq(localUsers.id, user.id));

      // Generate token and return it
      const token = await sign({ userId: user.id, type: "local" });

      return {
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.nombre,
          role: user.role,
        },
      };
    }),

  // Get current user from header token
  me: publicQuery.query(async ({ ctx }) => {
    // Try to get token from x-local-auth-token header
    const token = ctx.req.headers.get("x-local-auth-token");
    if (!token) return null;

    try {
      const payload = (await verify(token)) as Record<string, unknown> | null;
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
        username: u.username,
        name: u.nombre,
        email: u.email,
        role: u.role,
        avatar: null,
        lastSignInAt: u.nombre,
      };
    } catch {
      return null;
    }
  }),

  // List all local users
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
});
