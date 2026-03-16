import { useState } from 'react';
import { GroupSidebar } from '../components/chat/GroupSidebar';
import { ChatWindow } from '../components/chat/ChatWindow';
import { useGroupMembers, useMyGroups } from '../hooks/useGroup';
import { useCurrentUser } from '@/hooks/useCurrentUser';


interface Group {
    id: string;
    name: string;
}

export const ChatPage = () => {
    const { data: user } = useCurrentUser();
    const { data: my_groups = [] } = useMyGroups();
    const [activeGroup, setActiveGroup] = useState<Group | null>(null);

    const currentUserId = user?.user?.id ?? user?.id ?? '';

    const { data: membersData } = useGroupMembers(activeGroup?.id ?? '');

    // Check if current user is admin of the active group
    const isAdmin =
        membersData?.members?.some(
            (m: { userId: string; role: string }) =>
                m.userId === currentUserId && m.role === 'admin'
        ) ?? false;

    return (
        <div className="flex h-full bg-gray-100">
            <GroupSidebar
                myGroups={my_groups}
                activeGroupId={activeGroup?.id ?? null}
                onSelectGroup={setActiveGroup}
            />

            <div className="flex-1 flex flex-col">
                {activeGroup ? (
                    <ChatWindow
                        groupId={activeGroup.id}
                        groupName={activeGroup.name}
                        currentUserId={currentUserId}
                        isAdmin={isAdmin}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        Select a group to start chatting
                    </div>
                )}
            </div>
        </div>
    );
};