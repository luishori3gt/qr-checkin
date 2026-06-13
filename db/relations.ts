import { relations } from "drizzle-orm";
import { transportistas, personas, asistencias } from "./schema";

export const transportistasRelations = relations(transportistas, ({ many }) => ({
  personas: many(personas),
  asistencias: many(asistencias),
}));

export const personasRelations = relations(personas, ({ one, many }) => ({
  transportista: one(transportistas, {
    fields: [personas.transportistaId],
    references: [transportistas.id],
  }),
  asistencias: many(asistencias),
}));

export const asistenciasRelations = relations(asistencias, ({ one }) => ({
  persona: one(personas, {
    fields: [asistencias.personaId],
    references: [personas.id],
  }),
  transportista: one(transportistas, {
    fields: [asistencias.transportistaId],
    references: [transportistas.id],
  }),
}));
