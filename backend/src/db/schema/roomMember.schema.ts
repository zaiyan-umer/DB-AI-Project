import { pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { rooms } from "./room.schema";
import users from "./user.schema";


export const roomMembers = pgTable("room_members", {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("roomId").references(() => rooms.id),
    userId: uuid("userId").references(() => users.id),
    joinedAt: timestamp("joinedAt").defaultNow()
}, (t) => ({
    unq: unique().on(t.roomId, t.userId)
}))

export type roomMembers = typeof roomMembers.$inferSelect
export type newRoomMembers = typeof roomMembers.$inferInsert

export const roomMemberSchema = createSelectSchema(roomMembers)
export const newRoomMemberSchema = createInsertSchema(roomMembers)

