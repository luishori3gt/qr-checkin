import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Tabla de transportistas (líneas de transporte)
export const transportistas = mysqlTable("transportistas", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  descripcion: text("descripcion"),
  color: varchar("color", { length: 7 }).default("#3B82F6"),
  qrCode: varchar("qrCode", { length: 255 }).default("").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Transportista = typeof transportistas.$inferSelect;
export type InsertTransportista = typeof transportistas.$inferInsert;

// Tabla de personas (trabajadores/choferes que tienen QR)
export const personas = mysqlTable("personas", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  transportistaId: bigint("transportistaId", { mode: "number", unsigned: true }).notNull(),
  qrCode: varchar("qrCode", { length: 255 }).notNull().unique(),
  activo: mysqlEnum("activo", ["si", "no"]).default("si").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Persona = typeof personas.$inferSelect;
export type InsertPersona = typeof personas.$inferInsert;

// Tabla de asistencias (registro de entradas)
export const asistencias = mysqlTable("asistencias", {
  id: serial("id").primaryKey(),
  personaId: bigint("personaId", { mode: "number", unsigned: true }).notNull(),
  transportistaId: bigint("transportistaId", { mode: "number", unsigned: true }).notNull(),
  tipo: mysqlEnum("tipo", ["entrada", "salida"]).default("entrada").notNull(),
  fechaHora: timestamp("fechaHora").defaultNow().notNull(),
  notas: text("notas"),
  registradoPor: bigint("registradoPor", { mode: "number", unsigned: true }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Asistencia = typeof asistencias.$inferSelect;
export type InsertAsistencia = typeof asistencias.$inferInsert;

// Tabla de asistencias de transportistas (registro de llegada/salida de unidades)
export const asistenciasTransportistas = mysqlTable("asistencias_transportistas", {
  id: serial("id").primaryKey(),
  transportistaId: bigint("transportistaId", { mode: "number", unsigned: true }).notNull(),
  tipo: mysqlEnum("tipo", ["entrada", "salida"]).default("entrada").notNull(),
  fechaHora: timestamp("fechaHora").defaultNow().notNull(),
  notas: text("notas"),
  registradoPor: bigint("registradoPor", { mode: "number", unsigned: true }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AsistenciaTransportista = typeof asistenciasTransportistas.$inferSelect;
export type InsertAsistenciaTransportista = typeof asistenciasTransportistas.$inferInsert;

// Tabla de usuarios locales (autenticacion por contraseña)
export const localUsers = mysqlTable("local_users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  activo: mysqlEnum("activo", ["si", "no"]).default("si").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type LocalUser = typeof localUsers.$inferSelect;
export type InsertLocalUser = typeof localUsers.$inferInsert;
