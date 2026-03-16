import { useState } from 'react';
import { GroupSidebar } from '../components/chat/GroupSidebar';
import { ChatWindow } from '../components/chat/ChatWindow';
import { useMyGroups } from '../hooks/useGroup';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSocket } from '@/hooks/useSocket';
import { useGroupSocket } from '@/hooks/useGroupSocket';
import { useOnlineCount } from '@/hooks/useOnlineCount';


interface Group {
    id: string;
    name: string;
    role: 'admin' | 'member';
}

export const ChatPage = () => {
    const { data: user } = useCurrentUser();
    const { data: my_groups = [] } = useMyGroups();
    const [activeGroup, setActiveGroup] = useState<Group | null>(null);

    const currentUserId = user?.user?.id ?? user?.id ?? '';

    // Connect socket when page loads
    useSocket();

    // Join/leave room when active group changes
    useGroupSocket(activeGroup?.id ?? null);

    const onlineCount = useOnlineCount(activeGroup?.id ?? null);

    // Resolve admin status from my-groups payload to avoid admin-only endpoint calls.
    const isAdmin = activeGroup?.role === 'admin';

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
                        isAdmin={!!isAdmin}
                        onlineCount={onlineCount}
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