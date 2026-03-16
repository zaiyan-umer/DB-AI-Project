import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createGroup, searchGroups, joinGroup, getGroupMembers, getMyGroups } from '../services/chat.services';

export const useSearchGroups = (name: string) => {
    return useQuery({
        queryKey: ['groups', 'search', name],
        queryFn: () => searchGroups(name),
        enabled: name.trim().length > 0,
        staleTime: 30_000,
    });
};

export const useGroupMembers = (groupId: string) => {
    return useQuery({
        queryKey: ['groups', groupId, 'members'],
        queryFn: () => getGroupMembers(groupId),
        enabled: !!groupId,
    });
};

export const useCreateGroup = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (name: string) => createGroup(name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
        },
    });
};

export const useJoinGroup = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (groupId: string) => joinGroup(groupId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
        },
    });
};

export const useMyGroups = () => {
    return useQuery({
        queryKey: ['groups', 'mine'],
        queryFn: getMyGroups,
        staleTime: 30_000,
    });
}