import { eq } from "drizzle-orm"
import db from "../../db/connection"
import { rooms } from "../../db/schema/room.schema"
import { newMessage, messages } from "../../db/schema/messages.schema"
import users from "../../db/schema/user.schema"

export const makeOrGetRoom = async (courseName: string) => {
    try {
        const [existingRoom] = await db.select().from(rooms).where(eq(rooms.courseName, courseName)).limit(1)

        if (existingRoom) return existingRoom

        const [newRoom] = await db.insert(rooms).values({ courseName }).returning()

        return newRoom
    } catch (error) {
        throw new Error(`Failed to create or fetch room for course: ${courseName}. ${(error as Error).message}`)
    }
}

export const getPreviousRoomMessages = async (roomId: string) => {
    try {
        return await db.select()
            .from(messages)
            .where(eq(messages.roomId, roomId))
            .orderBy(messages.createdAt)
    } catch (error) {
        throw new Error(`Failed to get messages for room: ${roomId}. ${(error as Error).message}`)
    }
}

export const saveMessage = async (roomId: string, senderId: string, content: string) => {
    try {
        const [msg] = await db
            .insert(messages)
            .values({ roomId, senderId, content })
            .returning();

        const [sender] = await db.select().from(users).
            where(eq(users.id, senderId))

        return { ...msg, senderName: sender?.username ?? "Unknown" };
    } catch (error) {
        throw new Error(`Failed to save message in room: ${roomId}. ${(error as Error).message}`)
    }
}

