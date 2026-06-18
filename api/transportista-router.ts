import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { transportistas, asistenciasTransportistas } from "@db/schema";
import { eq, desc, sql, and, gte } from "drizzle-orm";
import crypto from "crypto";

// Rutas por linea transportista - debe coincidir con contracts/rutas.ts
const RUTAS_POR_LINEA: Record<string, string[]> = {
  "Panda": ["Queretaro", "Puebla", "Toluca"],
  "DJ": ["Herradura", "Interlomas", "Santa Fe", "Lilas"],
  "Libra": ["Chapultepec", "Herradura", "Toluca"],
  "Ledesma": ["Satelite"],
  "Andame": ["Pilares", "Carso"],
  "Aguilar": ["San Jeronimo", "San Miguel", "Rio Mayo"],
};

function getRutasPorLinea(nombreLinea: string): string[] {
  if (RUTAS_POR_LINEA[nombreLinea]) return RUTAS_POR_LINEA[nombreLinea];
  const key = Object.keys(RUTAS_POR_LINEA).find(
    (k) => k.toLowerCase() === nombreLinea.toLowerCase()
  );
  return key ? RUTAS_POR_LINEA[key] : [];
}

function getLineas(): string[] {
  return Object.keys(RUTAS_POR_LINEA);
}

export const transportistaRouter = createRouter({
  // Listar lineas disponibles del archivo (no creadas aun)
  lineasDisponibles: publicQuery.query(async () => {
    const db = getDb();
    const existing = await db.select().from(transportistas);
    const existingNames = new Set(existing.map((t) => t.nombre.toLowerCase()));
    return getLineas().filter((l) => !existingNames.has(l.toLowerCase()));
  }),

  // Obtener rutas de una linea
  getRutas: publicQuery
    .input(z.object({ nombre: z.string() }))
    .query(async ({ input }) => {
      return getRutasPorLinea(input.nombre);
    }),

  list: publicQuery.query(async () => {
    const db = getDb();
    const all = await db.select().from(transportistas);
    // Incluir rutas asociadas
    return all.map((t) => ({
      ...t,
      rutas: getRutasPorLinea(t.nombre),
    }));
  }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const results = await db
        .select()
        .from(transportistas)
        .where(eq(transportistas.id, input.id));
      if (!results[0]) return null;
      return {
        ...results[0],
        rutas: getRutasPorLinea(results[0].nombre),
      };
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
      if (!results[0]) return null;
      return {
        ...results[0],
        rutas: getRutasPorLinea(results[0].nombre),
      };
    }),

  create: publicQuery
    .input(
      z.object({
        nombre: z.string().min(1).max(255),
        descripcion: z.string().optional(),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Validar que el nombre exista en el listado de rutas
      const rutas = getRutasPorLinea(input.nombre);
      if (rutas.length === 0) {
        throw new Error(
          `La linea "${input.nombre}" no esta en el listado. Las lineas permitidas son: ${getLineas().join(", ")}`
        );
      }

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
      return { id: Number(result[0].insertId), qrCode, rutas };
    }),

  update: publicQuery
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

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .delete(transportistas)
        .where(eq(transportistas.id, input.id));
      return { success: true };
    }),

  // Asistencia de transportistas (llegada/salida de unidades)
  registrarAsistencia: publicQuery
    .input(
      z.object({
        qrCode: z.string(),
        tipo: z.enum(["entrada", "salida"]).default("entrada"),
        ruta: z.string().default(""),
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
        ruta: input.ruta,
        tipo: input.tipo,
        notas: input.notas,
        registradoPor: input.registradoPor,
      });

      return {
        id: Number(result[0].insertId),
        transportistaNombre: transportista.nombre,
        transportistaId: transportista.id,
        ruta: input.ruta,
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
          ruta: asistenciasTransportistas.ruta,
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

  // Borrar TODAS las asistencias de unidades
  borrarTodo: publicQuery
    .input(z.object({ confirmar: z.literal("BORRAR") }))
    .mutation(async () => {
      const db = getDb();
      await db.delete(asistenciasTransportistas);
      return { success: true, message: "Asistencias de unidades eliminadas" };
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
        ruta: asistenciasTransportistas.ruta,
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
