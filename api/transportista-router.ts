import { z } from "zod";
import { createRouter, publicQuery, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { transportistas, asistenciasTransportistas } from "@db/schema";
import { eq, desc, sql, and, gte } from "drizzle-orm";
import crypto from "crypto";

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

  // Buscar transportista por QR (para el escaner)
  getByQrCode: publicQuery
    .input(z.object({ qrCode: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const results = await db
        .select()
        .from(transportistas)
        .where(eq(transportistas.qrCode, input.qrCode));
      return results[0] ?? null;
    }),

  create: adminQuery
    .input(
      z.object({
        nombre: z.string().min(1).max(255),
        descripcion: z.string().optional(),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      // Generar QR unico para el transportista
      const qrData = `TRANSPORTISTA-${input.nombre}-${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
      const qrCode = crypto.createHash("sha256").update(qrData).digest("hex");

      const result = await db.insert(transportistas).values({
        nombre: input.nombre,
        descripcion: input.descripcion,
        color: input.color ?? "#3B82F6",
        qrCode,
      });
      return { id: Number(result[0].insertId), qrCode };
    }),

  update: adminQuery
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

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .delete(transportistas)
        .where(eq(transportistas.id, input.id));
      return { success: true };
    }),

  // Asistencia de transportistas (llegada/salida de unidades)
  registrarAsistencia: authedQuery
    .input(
      z.object({
        qrCode: z.string(),
        tipo: z.enum(["entrada", "salida"]).default("entrada"),
        notas: z.string().optional(),
        registradoPor: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // Buscar transportista por QR
      const transportistaResults = await db
        .select()
        .from(transportistas)
        .where(eq(transportistas.qrCode, input.qrCode));

      if (transportistaResults.length === 0) {
        throw new Error("QR no valido o transportista no encontrado");
      }

      const transportista = transportistaResults[0];

      // Registrar asistencia de la unidad
      const result = await db.insert(asistenciasTransportistas).values({
        transportistaId: transportista.id,
        tipo: input.tipo,
        notas: input.notas,
        registradoPor: input.registradoPor,
      });

      return {
        id: Number(result[0].insertId),
        transportistaNombre: transportista.nombre,
        transportistaId: transportista.id,
        tipo: input.tipo,
        fechaHora: new Date(),
      };
    }),

  // Listar asistencias de transportistas
  listAsistencias: publicQuery
    .query(async () => {
      const db = getDb();
      let query = db
        .select({
          id: asistenciasTransportistas.id,
          transportistaId: asistenciasTransportistas.transportistaId,
          tipo: asistenciasTransportistas.tipo,
          fechaHora: asistenciasTransportistas.fechaHora,
          notas: asistenciasTransportistas.notas,
          registradoPor: asistenciasTransportistas.registradoPor,
          createdAt: asistenciasTransportistas.createdAt,
          transportistaNombre: transportistas.nombre,
          transportistaColor: transportistas.color,
        })
        .from(asistenciasTransportistas)
        .leftJoin(
          transportistas,
          eq(asistenciasTransportistas.transportistaId, transportistas.id)
        )
        .orderBy(desc(asistenciasTransportistas.fechaHora));

      return query;
    }),

  // Estadisticas del dia para transportistas
  estadisticasHoy: publicQuery.query(async () => {
    const db = getDb();
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const totalEntradas = await db
      .select({ count: sql<number>`count(*)` })
      .from(asistenciasTransportistas)
      .where(
        and(
          gte(asistenciasTransportistas.fechaHora, hoy),
          eq(asistenciasTransportistas.tipo, "entrada")
        )
      );

    const totalSalidas = await db
      .select({ count: sql<number>`count(*)` })
      .from(asistenciasTransportistas)
      .where(
        and(
          gte(asistenciasTransportistas.fechaHora, hoy),
          eq(asistenciasTransportistas.tipo, "salida")
        )
      );

    const recientes = await db
      .select({
        id: asistenciasTransportistas.id,
        transportistaId: asistenciasTransportistas.transportistaId,
        tipo: asistenciasTransportistas.tipo,
        fechaHora: asistenciasTransportistas.fechaHora,
        transportistaNombre: transportistas.nombre,
        transportistaColor: transportistas.color,
      })
      .from(asistenciasTransportistas)
      .leftJoin(
        transportistas,
        eq(asistenciasTransportistas.transportistaId, transportistas.id)
      )
      .where(gte(asistenciasTransportistas.fechaHora, hoy))
      .orderBy(desc(asistenciasTransportistas.fechaHora))
      .limit(10);

    return {
      totalEntradas: totalEntradas[0]?.count ?? 0,
      totalSalidas: totalSalidas[0]?.count ?? 0,
      recientes,
    };
  }),
});
