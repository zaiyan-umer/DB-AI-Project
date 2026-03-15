import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import users from "./user.schema";
import groups from "./group.schema";

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  deletedAt: timestamp("deleted_at"), // null = not deleted, set = soft deleted for everyone (admin)
  createdAt: timestamp("created_at").defaultNow(),
});

export const messageDeletions = pgTable("message_deletions", {
  id: uuid("id").primaryKey().defaultRandom(),
  messageId: uuid("message_id")
    .notNull()
    .references(() => messages.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  deletedAt: timestamp("deleted_at").defaultNow(),
});

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type MessageDeletion = typeof messageDeletions.$inferSelect;

export const newMessageSchema = createInsertSchema(messages, {
  content: (schema) => schema.min(1).max(2000).trim(),
});
export const messageSchema = createSelectSchema(messages);