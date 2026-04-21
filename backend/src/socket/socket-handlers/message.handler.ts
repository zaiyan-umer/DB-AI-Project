import { Server } from 'socket.io';
import { AuthenticatedSocket } from '..';
import { db } from '../../db/connection';
import { messages } from '../../db/schema/messages.schema';
import { groupMembers } from '../../db/schema/groupMember.schema';
import { eq, and } from 'drizzle-orm';

export const registerMessageHandlers = (
  io: Server,
  socket: AuthenticatedSocket
) => {
  const userId = socket.data.user.id;

  // Client saves to DB via REST first, then emits this with the saved message
  // Server just broadcasts it to the room — no DB write here
  socket.on('send_message', (message: {
    id: string;
    groupId: string;
    content: string;
    createdAt: string;
    sender: {
      id: string;
      username: string;
      firstName: string;
      lastName: string;
    };
  }) => {
    // Broadcast to everyone in the room including sender
    // Sender needs it too — so all tabs/devices of sender stay in sync
    io.to(message.groupId).emit('new_message', message);
  });

  // Client calls REST DELETE first, then emits this to broadcast the deletion
  socket.on('delete_message_everyone', async (data: {
    messageId: string;
    groupId: string;
  }) => {
    const { messageId, groupId } = data;

    // Verify the user is admin or message author before broadcasting
    const message = await db
      .select({ userId: messages.userId })
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (message.length === 0) return;

    const isAuthor = message[0].userId === userId;

    const adminCheck = await db
      .select({ role: groupMembers.role })
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, userId)
        )
      )
      .limit(1);

    const isAdmin = adminCheck[0]?.role === 'admin';

    if (!isAuthor && !isAdmin) return;

    // Broadcast deletion to room — clients update their UI
    io.to(groupId).emit('message_deleted', { messageId, groupId });
  });
};