import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { personas, transportistas } from "@db/schema";
import { eq, and, like } from "drizzle-orm";
import crypto from "crypto";

export const personaRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    return db
      .select({
        id: personas.id,
        nombre: personas.nombre,
        transportistaId: personas.transportistaId,
        qrCode: personas.qrCode,
        activo: personas.activo,
        createdAt: personas.createdAt,
        transportistaNombre: transportistas.nombre,
        transportistaColor: transportistas.color,
      })
      .from(personas)
      .leftJoin(
        transportistas,
        eq(personas.transportistaId, transportistas.id)
      );
  }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const results = await db
        .select({
          id: personas.id,
          nombre: personas.nombre,
          transportistaId: personas.transportistaId,
          qrCode: personas.qrCode,
          activo: personas.activo,
          createdAt: personas.createdAt,
          transportistaNombre: transportistas.nombre,
          transportistaColor: transportistas.color,
        })
        .from(personas)
        .leftJoin(
          transportistas,
          eq(personas.transportistaId, transportistas.id)
        )
        .where(eq(personas.id, input.id));
      return results[0] ?? null;
    }),

  getByQrCode: publicQuery
    .input(z.object({ qrCode: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const results = await db
        .select({
          id: personas.id,
          nombre: personas.nombre,
          transportistaId: personas.transportistaId,
          qrCode: personas.qrCode,
          activo: personas.activo,
          createdAt: personas.createdAt,
          transportistaNombre: transportistas.nombre,
          transportistaColor: transportistas.color,
        })
        .from(personas)
        .leftJoin(
          transportistas,
          eq(personas.transportistaId, transportistas.id)
        )
        .where(eq(personas.qrCode, input.qrCode));
      return results[0] ?? null;
    }),

  search: publicQuery
    .input(
      z.object({
        query: z.string().optional(),
        transportistaId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      let query = db
        .select({
          id: personas.id,
          nombre: personas.nombre,
          transportistaId: personas.transportistaId,
          qrCode: personas.qrCode,
          activo: personas.activo,
          createdAt: personas.createdAt,
          transportistaNombre: transportistas.nombre,
          transportistaColor: transportistas.color,
        })
        .from(personas)
        .leftJoin(
          transportistas,
          eq(personas.transportistaId, transportistas.id)
        );

      const conditions = [];
      if (input.query) {
        conditions.push(like(personas.nombre, `%${input.query}%`));
      }
      if (input.transportistaId) {
        conditions.push(eq(personas.transportistaId, input.transportistaId));
      }
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as typeof query;
      }

      return query;
    }),

  create: publicQuery
    .input(
      z.object({
        nombre: z.string().min(1).max(255),
        transportistaId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      // Generar QR code único basado en nombre + transportistaId + timestamp + random
      const qrData = `${input.nombre}-${input.transportistaId}-${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
      const qrCode = crypto.createHash("sha256").update(qrData).digest("hex");

      const result = await db.insert(personas).values({
        nombre: input.nombre,
        transportistaId: input.transportistaId,
        qrCode,
        activo: "si",
      });
      return { id: Number(result[0].insertId), qrCode };
    }),

  update: publicQuery
    .input(
      z.object({
        id: z.number(),
        nombre: z.string().min(1).max(255).optional(),
        transportistaId: z.number().optional(),
        activo: z.enum(["si", "no"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db
        .update(personas)
        .set(data)
        .where(eq(personas.id, id));
      return { success: true };
    }),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(personas).where(eq(personas.id, input.id));
      return { success: true };
    }),
});
