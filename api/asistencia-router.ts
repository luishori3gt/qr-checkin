import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { asistencias, personas, transportistas } from "@db/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

export const asistenciaRouter = createRouter({
  // Listar todas las asistencias con info de persona y transportista
  list: publicQuery
    .input(
      z
        .object({
          fechaDesde: z.string().optional(),
          fechaHasta: z.string().optional(),
          transportistaId: z.number().optional(),
          personaId: z.number().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      let query = db
        .select({
          id: asistencias.id,
          personaId: asistencias.personaId,
          transportistaId: asistencias.transportistaId,
          tipo: asistencias.tipo,
          fechaHora: asistencias.fechaHora,
          notas: asistencias.notas,
          registradoPor: asistencias.registradoPor,
          createdAt: asistencias.createdAt,
          personaNombre: personas.nombre,
          transportistaNombre: transportistas.nombre,
          transportistaColor: transportistas.color,
        })
        .from(asistencias)
        .leftJoin(personas, eq(asistencias.personaId, personas.id))
        .leftJoin(
          transportistas,
          eq(asistencias.transportistaId, transportistas.id)
        )
        .orderBy(desc(asistencias.fechaHora));

      const conditions = [];
      if (input?.fechaDesde) {
        conditions.push(gte(asistencias.fechaHora, new Date(input.fechaDesde)));
      }
      if (input?.fechaHasta) {
        conditions.push(lte(asistencias.fechaHora, new Date(input.fechaHasta)));
      }
      if (input?.transportistaId) {
        conditions.push(
          eq(asistencias.transportistaId, input.transportistaId)
        );
      }
      if (input?.personaId) {
        conditions.push(eq(asistencias.personaId, input.personaId));
      }
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as typeof query;
      }

      return query;
    }),

  // Obtener una asistencia por ID
  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const results = await db
        .select({
          id: asistencias.id,
          personaId: asistencias.personaId,
          transportistaId: asistencias.transportistaId,
          tipo: asistencias.tipo,
          fechaHora: asistencias.fechaHora,
          notas: asistencias.notas,
          registradoPor: asistencias.registradoPor,
          createdAt: asistencias.createdAt,
          personaNombre: personas.nombre,
          transportistaNombre: transportistas.nombre,
          transportistaColor: transportistas.color,
        })
        .from(asistencias)
        .leftJoin(personas, eq(asistencias.personaId, personas.id))
        .leftJoin(
          transportistas,
          eq(asistencias.transportistaId, transportistas.id)
        )
        .where(eq(asistencias.id, input.id));
      return results[0] ?? null;
    }),

  // Registrar entrada o salida
  registrar: publicQuery
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

      // Buscar persona por QR
      const personaResults = await db
        .select()
        .from(personas)
        .where(eq(personas.qrCode, input.qrCode));

      if (personaResults.length === 0) {
        throw new Error("QR no válido o persona no encontrada");
      }

      const persona = personaResults[0];

      if (persona.activo === "no") {
        throw new Error("Esta persona está inactiva");
      }

      // Registrar asistencia
      const result = await db.insert(asistencias).values({
        personaId: persona.id,
        transportistaId: persona.transportistaId,
        tipo: input.tipo,
        notas: input.notas,
        registradoPor: input.registradoPor,
      });

      return {
        id: Number(result[0].insertId),
        personaNombre: persona.nombre,
        personaId: persona.id,
        transportistaId: persona.transportistaId,
        tipo: input.tipo,
        fechaHora: new Date(),
      };
    }),

  // Estadísticas del día
  estadisticasHoy: publicQuery.query(async () => {
    const db = getDb();
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const totalEntradas = await db
      .select({ count: sql<number>`count(*)` })
      .from(asistencias)
      .where(
        and(
          gte(asistencias.fechaHora, hoy),
          eq(asistencias.tipo, "entrada")
        )
      );

    const totalSalidas = await db
      .select({ count: sql<number>`count(*)` })
      .from(asistencias)
      .where(
        and(
          gte(asistencias.fechaHora, hoy),
          eq(asistencias.tipo, "salida")
        )
      );

    // Por transportista
    const porTransportista = await db
      .select({
        transportistaId: asistencias.transportistaId,
        transportistaNombre: transportistas.nombre,
        transportistaColor: transportistas.color,
        entradas: sql<number>`count(case when ${asistencias.tipo} = 'entrada' then 1 end)`,
        salidas: sql<number>`count(case when ${asistencias.tipo} = 'salida' then 1 end)`,
      })
      .from(asistencias)
      .leftJoin(
        transportistas,
        eq(asistencias.transportistaId, transportistas.id)
      )
      .where(gte(asistencias.fechaHora, hoy))
      .groupBy(asistencias.transportistaId);

    return {
      totalEntradas: totalEntradas[0]?.count ?? 0,
      totalSalidas: totalSalidas[0]?.count ?? 0,
      porTransportista,
    };
  }),

  // Borrar TODAS las asistencias de personas
  borrarTodo: publicQuery
    .input(z.object({ confirmar: z.literal("BORRAR") }))
    .mutation(async () => {
      const db = getDb();
      await db.delete(asistencias);
      return { success: true, message: "Asistencias de personas eliminadas" };
    }),

  // Asistencias recientes (últimas 20)
  recientes: publicQuery.query(async () => {
    const db = getDb();
    return db
      .select({
        id: asistencias.id,
        personaId: asistencias.personaId,
        transportistaId: asistencias.transportistaId,
        tipo: asistencias.tipo,
        fechaHora: asistencias.fechaHora,
        notas: asistencias.notas,
        personaNombre: personas.nombre,
        transportistaNombre: transportistas.nombre,
        transportistaColor: transportistas.color,
      })
      .from(asistencias)
      .leftJoin(personas, eq(asistencias.personaId, personas.id))
      .leftJoin(
        transportistas,
        eq(asistencias.transportistaId, transportistas.id)
      )
      .orderBy(desc(asistencias.fechaHora))
      .limit(20);
  }),
});
