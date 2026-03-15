import z from "zod";
import { newMessage, newMessageSchema } from "../db/schema/messages.schema";
import { getPreviousRoomMessages, makeOrGetRoom, saveMessage } from "../services/dal/chat.dal";
import db from "../db/connection";
import { roomMembers } from "../db/schema/roomMember.schema";
import { eq, sql } from "drizzle-orm";
import { rooms } from "../db/schema/room.schema";


const joinRoomSchema = z.object({
    courseName: z.string().min(1),
    userId: z.string().min(1)
})

export const chatHandler = (io: any, socket: any) => {

    socket.on('room:join', async (courseName: string, userId: string) => {
        const result = joinRoomSchema.safeParse({ courseName, userId })

        console.log(result);


        if (!result.success) {
            socket.emit('room:error', result.error.flatten())
            return
        }
        const room = await makeOrGetRoom(courseName)

        const [{ count }] = await db.select({ count: sql<number>`count(*)` })
            .from(roomMembers)
            .where(eq(roomMembers.roomId, room.id))

        if (socket.rooms.has(room.id)) {
            socket.emit('room:joined', { roomId: room.id, courseName: room.courseName, members: count })
            return
        }

        socket.join(room.id);

        await db.insert(roomMembers).values({ roomId: room.id, userId })
            .returning().onConflictDoNothing()

        // recount after insert
        const [{ count: updatedCount }] = await db.select({ count: sql<number>`count(*)` })
            .from(roomMembers)
            .where(eq(roomMembers.roomId, room.id))

        socket.emit('room:joined', { roomId: room.id, courseName: room.courseName, members: updatedCount })
        io.to(room.id).emit('room:member_joined', { roomId: room.id, courseName: room.courseName, members: updatedCount })
    })

    socket.on('rooms:get', async () => {
        const user = socket.data.user

        const userRooms = await db.select({
            roomId: rooms.id,
            courseName: rooms.courseName,
            members: sql<number>`(select count(*) from ${roomMembers} where ${roomMembers.roomId} = ${rooms.id})`
        })
            .from(roomMembers)
            .where(eq(roomMembers.userId, user.id))
            .innerJoin(rooms, eq(roomMembers.roomId, rooms.id))

        console.log(userRooms, user.username);

        socket.emit('rooms:list', userRooms)
    })

}





// socket.on('message:send', async (data: newMessage) => {
//     const result = newMessageSchema.safeParse(data)

//     if (!result.success) {
//         console.log(result.error.flatten());
//         socket.emit('message:error', result.error.flatten())
//         return
//     }

//     const saved = await saveMessage(data.roomId, data.senderId, data.content);

//     io.to(data.roomId).emit('message:received', saved);
// })

// const prevMessages = await getPreviousRoomMessages(room.id)

// socket.emit('message:history', prevMessages)