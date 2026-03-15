import { parse } from 'cookie';
import { Server } from 'socket.io';
import env from '../config/env';
import { chatHandler } from '../controllers/chat.controller';
import { verifyJWT } from '../middleware/verifyToken.middleware';
import db from '../db/connection';
import { roomMembers } from '../db/schema/roomMember.schema';
import { eq } from 'drizzle-orm';
import { rooms } from '../db/schema/group.schema';

export const initSocket = (server: any) => {
    const io = new Server(server, {
        cors: {
            origin: env.CORS_ORIGIN,
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.use((socket, next) => {
        const cookie = socket.handshake.headers.cookie
        const token = parse(cookie ?? "")?.token

        // TODO: make next error handler
        if (!token) return next(new Error("Unauthorized"));

        try {
            socket.data.user = verifyJWT(token);
            next();
        } catch (err) {
            next(new Error("Invalid token"));
        }
    })

    io.on('connection', async (socket) => {
        console.log('user connected: ', socket.id);

        const user = socket.data.user

        // console.log(user);

        chatHandler(io, socket);

        socket.on('disconnect', () => {
            console.log('user disconnected: ', socket.id);
        })
    })

    return io;
}