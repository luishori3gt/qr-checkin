import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const usuarioRouter = createRouter({
  // Listar todos los usuarios que tienen acceso
  list: publicQuery.query(async () => {
    const db = getDb();
    return db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatar: users.avatar,
        role: users.role,
        createdAt: users.createdAt,
        lastSignInAt: users.lastSignInAt,
      })
      .from(users)
      .orderBy(desc(users.lastSignInAt));
  }),

  // Cambiar rol de un usuario
  updateRole: publicQuery
    .input(
      z.object({
        id: z.number(),
        role: z.enum(["user", "admin"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(users)
        .set({ role: input.role })
        .where(eq(users.id, input.id));
      return { success: true };
    }),
});
