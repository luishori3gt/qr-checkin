import { mysqlTable, mysqlSchema, AnyMySqlColumn, bigint, mysqlEnum, timestamp, text, index, varchar } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const asistencias = mysqlTable("asistencias", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	personaId: bigint({ mode: "number", unsigned: true }).notNull(),
	transportistaId: bigint({ mode: "number", unsigned: true }).notNull(),
	tipo: mysqlEnum(['entrada','salida']).default('entrada').notNull(),
	fechaHora: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	notas: text(),
	registradoPor: bigint({ mode: "number", unsigned: true }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const localUsers = mysqlTable("local_users", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	username: varchar({ length: 100 }).notNull(),
	passwordHash: varchar({ length: 255 }).notNull(),
	nombre: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 320 }),
	role: mysqlEnum(['user','admin']).default('user').notNull(),
	activo: mysqlEnum(['si','no']).default('si').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	lastSignInAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("local_users_username_unique").on(table.username),
	index("id").on(table.id),
]);

export const personas = mysqlTable("personas", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	nombre: varchar({ length: 255 }).notNull(),
	transportistaId: bigint({ mode: "number", unsigned: true }).notNull(),
	qrCode: varchar({ length: 255 }).notNull(),
	activo: mysqlEnum(['si','no']).default('si').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const transportistas = mysqlTable("transportistas", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	nombre: varchar({ length: 255 }).notNull(),
	descripcion: text(),
	color: varchar({ length: 7 }).default('#3B82F6'),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const users = mysqlTable("users", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	unionId: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }),
	email: varchar({ length: 320 }),
	avatar: text(),
	role: mysqlEnum(['user','admin']).default('user').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	lastSignInAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});
