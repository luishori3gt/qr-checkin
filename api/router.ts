import { authRouter } from "./auth-router";
import { transportistaRouter } from "./transportista-router";
import { personaRouter } from "./persona-router";
import { asistenciaRouter } from "./asistencia-router";
import { sheetsRouter } from "./sheets-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  transportistas: transportistaRouter,
  personas: personaRouter,
  asistencias: asistenciaRouter,
  sheets: sheetsRouter,
});

export type AppRouter = typeof appRouter;
