import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteForEveryone, deleteForMe, getMessages, sendMessage } from '../services/chat.services';
import { getSocket } from '../socket';

export const useMessages = (groupId: string) => {
  return useInfiniteQuery({
    queryKey: ['messages', groupId],
    queryFn: ({ pageParam }) => getMessages(groupId, pageParam as string | undefined),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined,
    enabled: !!groupId,
  });
};

export const useSendMessage = (groupId: string) => {
  return useMutation({
    mutationFn: (content: string) => sendMessage(groupId, content),
    onSuccess: (savedMessage) => {
      // REST saved to DB, socket delivers to room
      // No invalidateQueries — socket event handles cache update for everyone
      getSocket().emit('send_message', savedMessage);
    },
  });
};

export const useDeleteForMe = (groupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => deleteForMe(groupId, messageId),
    onSuccess: () => {
      // Delete for me is local only — no socket needed, just refetch for this user
      queryClient.invalidateQueries({ queryKey: ['messages', groupId] });
    },
  });
};

export const useDeleteForEveryone = (groupId: string) => {
  return useMutation({
    mutationFn: (messageId: string) => deleteForEveryone(groupId, messageId), // keep groupId
    onSuccess: (_, messageId) => {
      // REST soft deleted in DB, socket broadcasts to room
      getSocket().emit('delete_message_everyone', { messageId, groupId });
    },
  });
};