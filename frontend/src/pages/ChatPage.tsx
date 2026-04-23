import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
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
        <div className="flex h-full bg-[var(--bg-page)] text-[var(--text-primary)] font-sans">
            <GroupSidebar
                myGroups={my_groups}
                activeGroupId={activeGroup?.id ?? null}
                onSelectGroup={setActiveGroup}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                <AnimatePresence mode="wait">
                    {activeGroup ? (
                        <motion.div
                            key={activeGroup.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 8 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="flex flex-col h-full"
                        >
                            <ChatWindow
                                groupId={activeGroup.id}
                                groupName={activeGroup.name}
                                currentUserId={currentUserId}
                                isAdmin={!!isAdmin}
                                onlineCount={onlineCount}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="flex-1 flex items-center justify-center text-[var(--text-faint)]"
                        >
                            Select a group to start chatting
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};