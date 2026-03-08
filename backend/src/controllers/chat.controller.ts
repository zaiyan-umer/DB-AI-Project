import z from "zod";
import { newMessage, newMessageSchema } from "../db/schema/messages.schema";
import { getPreviousRoomMessages, makeOrGetRoom, saveMessage } from "../services/dal/chat.dal";


const joinRoomSchema = z.object({
    courseName: z.string().min(1)
})

export const chatHandler = (io: any, socket: any) => {
    socket.on('join_room', async (courseName: string) => {
        const result = joinRoomSchema.safeParse({ courseName })

        if (!result.success) {
            socket.emit('error', result.error.flatten())
            return
        }

        const room = await makeOrGetRoom(courseName)

        socket.join(room.id);

        console.log(socket.id, "has joined room", courseName);

        const prevMessages = await getPreviousRoomMessages(room.id)

        socket.emit('room_joined', { roomId: room.id, courseName: room.courseName })
        socket.emit("prev_messages", prevMessages)

        io.emit('joined_room', socket.id, courseName)
    })


    socket.on('send_message', async (data: newMessage) => {
        const result = newMessageSchema.safeParse(data)

        if (!result.success) {
            console.log(result.error.flatten());
            
            socket.emit('error', result.error.flatten())
            return
        }

        const saved = await saveMessage(data.roomId, data.senderId, data.content);

        io.to(data.roomId).emit('receive_message', saved);
    })
}