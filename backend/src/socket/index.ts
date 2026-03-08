import { Server } from 'socket.io';
import env from '../config/env';

export const initSocket = (server : any) => {
    const io = new Server(server, {
        cors: {
            origin: env.CORS_ORIGIN,
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', socket => {
        console.log('user connected: ', socket.id);

        socket.on('disconnect', () => {
            console.log('user disconnected: ', socket.id);
        })
    })

    return io;
}