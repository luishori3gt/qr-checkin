import { createRouter, authedQuery } from "./middleware";
import { syncAsistenciasToSheet, isSheetsConfigured } from "./google-sheets";
import { getDb } from "./queries/connection";
import { asistencias, personas, transportistas } from "@db/schema";
import { desc } from "drizzle-orm";
import { eq } from "drizzle-orm";

export const sheetsRouter = createRouter({
  status: authedQuery.query(() => {
    return {
      configured: isSheetsConfigured(),
    };
  }),

  sync: authedQuery.mutation(async () => {
    const db = getDb();

    const allAsistencias = await db
      .select({
        id: asistencias.id,
        personaNombre: personas.nombre,
        transportistaNombre: transportistas.nombre,
        tipo: asistencias.tipo,
        fechaHora: asistencias.fechaHora,
        notas: asistencias.notas,
      })
      .from(asistencias)
      .leftJoin(personas, eq(asistencias.personaId, personas.id))
      .leftJoin(
        transportistas,
        eq(asistencias.transportistaId, transportistas.id)
      )
      .orderBy(desc(asistencias.fechaHora));

    const result = await syncAsistenciasToSheet(allAsistencias);
    return result;
  }),
});
