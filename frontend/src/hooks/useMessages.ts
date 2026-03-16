import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMessages, sendMessage, deleteForMe, deleteForEveryone } from '../services/chat.services';

// Infinite query — each page uses the nextCursor from the previous page
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => sendMessage(groupId, content),
    onSuccess: () => {
      // Refetch messages after send so new message appears
      queryClient.invalidateQueries({ queryKey: ['messages', groupId] });
    },
  });
};

export const useDeleteForMe = (groupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => deleteForMe(groupId, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', groupId] });
    },
  });
};

export const useDeleteForEveryone = (groupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => deleteForEveryone(groupId, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', groupId] });
    },
  });
};