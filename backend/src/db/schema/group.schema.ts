import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import users from "./user.schema";

export const groups = pgTable('groups', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(), // unique — groups are found by name
    createdAt: timestamp('created_at').defaultNow(),
    createdBy: uuid('created_by').references(() => users.id),
});

export type Room = typeof groups.$inferSelect
export type newRoom = typeof groups.$inferInsert

export const groupSchema = createSelectSchema(groups)
export const newGroupSchema = createInsertSchema(groups)

export default groups