import { authRouter } from "./auth-router";
import { localAuthRouter } from "./local-auth-router";
import { sessionRouter } from "./session-router";
import { transportistaRouter } from "./transportista-router";
import { personaRouter } from "./persona-router";
import { asistenciaRouter } from "./asistencia-router";
import { sheetsRouter } from "./sheets-router";
import { usuarioRouter } from "./usuario-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  localAuth: localAuthRouter,
  session: sessionRouter,
  transportistas: transportistaRouter,
  personas: personaRouter,
  asistencias: asistenciaRouter,
  sheets: sheetsRouter,
  usuarios: usuarioRouter,
});

export type AppRouter = typeof appRouter;
