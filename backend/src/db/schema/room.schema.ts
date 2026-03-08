import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const rooms = pgTable("rooms", {
    id: uuid("id").primaryKey().defaultRandom(),
    courseName: text("course"),
    createdAt: timestamp("createdAt").defaultNow()
})

export type Room = typeof rooms.$inferSelect
export type newRoom = typeof rooms.$inferInsert

export const roomSchema = createSelectSchema(rooms)
export const newRoomSchema = createInsertSchema(rooms)