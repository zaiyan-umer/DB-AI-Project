// import z from "zod";
// import { newMessage, newMessageSchema } from "../db/schema/messages.schema";
// import { getPreviousRoomMessages, makeOrGetRoom, saveMessage } from "../services/dal/chat.dal";
// import db from "../db/connection";
// import { groupMembers } from "../db/schema/groupMember.schema";
// import { eq, sql } from "drizzle-orm";
// import { groups } from "../db/schema/group.schema";


// const joinRoomSchema = z.object({
//     courseName: z.string().min(1),
//     userId: z.string().min(1)
// })

// export const chatHandler = (io: any, socket: any) => {

//     socket.on('room:join', async (courseName: string, userId: string) => {
//         const result = joinRoomSchema.safeParse({ courseName, userId })

//         console.log(result);


//         if (!result.success) {
//             socket.emit('room:error', result.error.flatten())
//             return
//         }
//         const room = await makeOrGetRoom(courseName)

//         const [{ count }] = await db.select({ count: sql<number>`count(*)` })
//             .from(groupMembers)
//             .where(eq(groupMembers.groupId, room.id))

//         if (socket.rooms.has(room.id)) {
//             socket.emit('room:joined', { roomId: room.id, courseName: room.courseName, members: count })
//             return
//         }

//         socket.join(room.id);

//         await db.insert(groupMembers).values({ groupId: room.id, userId })
//             .returning().onConflictDoNothing()

//         // recount after insert
//         const [{ count: updatedCount }] = await db.select({ count: sql<number>`count(*)` })
//             .from(groupMembers)
//             .where(eq(groupMembers.groupId, room.id))

//         socket.emit('room:joined', { roomId: room.id, courseName: room.courseName, members: updatedCount })
//         io.to(room.id).emit('room:member_joined', { roomId: room.id, courseName: room.courseName, members: updatedCount })
//     })

//     socket.on('rooms:get', async () => {
//         const user = socket.data.user

//         const userRooms = await db.select({
//             roomId: groups.id,
//             courseName: groups.name,
//             members: sql<number>`(select count(*) from ${groupMembers} where ${groupMembers.groupId} = ${groups.id})`
//         })
//             .from(groupMembers)
//             .where(eq(groupMembers.userId, user.id))
//             .innerJoin(groups, eq(groupMembers.groupId, groups.id))

//         console.log(userRooms, user.username);

//         socket.emit('rooms:list', userRooms)
//     })

// }





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