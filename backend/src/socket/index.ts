import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import { registerPresenceHandlers } from './socket-handlers/presence.handler';
import { registerMessageHandlers } from './socket-handlers/message.handler';

// Extend Socket type to carry authenticated user
export interface AuthenticatedSocket extends Socket {
  data: {
    user: {
      id: string;
      username: string;
    };
  };
}

export const initSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      // Need to change this in prod
      origin: 'http://localhost:5173',
      credentials: true,
    },
  });

  // Runs once per connection before any events are processed
  io.use((socket: AuthenticatedSocket, next) => {
    try {
      // Read JWT from HTTP-only cookie — same as REST middleware
      const cookies = parse(socket.handshake.headers.cookie ?? '');
      const token = cookies['token'];

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
        username: string;
      };

      // Attach user to socket — available in all handlers via socket.data.user
      socket.data.user = { id: payload.id, username: payload.username };
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // Register Handlers Per Connection
  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.data.user.username}`);

    registerPresenceHandlers(io, socket);
    registerMessageHandlers(io, socket);

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.data.user.username}`);
    });
  });

  return io;
};