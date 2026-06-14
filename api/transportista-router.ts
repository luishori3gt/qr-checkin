import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { transportistas } from "@db/schema";
import { eq } from "drizzle-orm";

export const transportistaRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(transportistas);
  }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const results = await db
        .select()
        .from(transportistas)
        .where(eq(transportistas.id, input.id));
      return results[0] ?? null;
    }),

  create: authedQuery
    .input(
      z.object({
        nombre: z.string().min(1).max(255),
        descripcion: z.string().optional(),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(transportistas).values({
        nombre: input.nombre,
        descripcion: input.descripcion,
        color: input.color ?? "#3B82F6",
      });
      return { id: Number(result[0].insertId) };
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        nombre: z.string().min(1).max(255).optional(),
        descripcion: z.string().optional(),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db
        .update(transportistas)
        .set(data)
        .where(eq(transportistas.id, id));
      return { success: true };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .delete(transportistas)
        .where(eq(transportistas.id, input.id));
      return { success: true };
    }),
});
