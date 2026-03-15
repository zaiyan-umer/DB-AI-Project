import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { rooms } from "./group.schema";
import users from "./user.schema";

export const messages = pgTable("messages", {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("roomId").notNull().references(() => rooms.id, { onDelete: 'cascade' }),
    senderId: uuid("senderId").notNull().references(() => users.id, { onDelete: 'cascade' }),
    content: text("content").notNull(),
    createdAt: timestamp("createdAt").defaultNow()
})

export type Message = typeof messages.$inferSelect
export type newMessage = typeof messages.$inferInsert

export const newMessageSchema = createInsertSchema(messages)
export const messageSchema = createSelectSchema(messages)