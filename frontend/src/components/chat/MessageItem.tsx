import { useState } from 'react';
import { useDeleteForMe, useDeleteForEveryone } from '../../hooks/useMessages';

interface Sender {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
}

interface Message {
  id: string;
  userId?: string;
  content: string;
  createdAt: string;
  deletedAt: string | null;
  sender?: Sender;
}

interface Props {
  message: Message;
  groupId: string;
  currentUserId: string;
  isAdmin: boolean;
}

export const MessageItem = ({ message, groupId, currentUserId, isAdmin }: Props) => {
  const [showOptions, setShowOptions] = useState(false);
  const deleteMe = useDeleteForMe(groupId);
  const deleteEveryone = useDeleteForEveryone(groupId);

  const senderId = message.sender?.id ?? message.userId ?? '';
  const senderUsername = message.sender?.username ?? 'Unknown user';
  const isOwn = senderId === currentUserId;
  const isDeleted = !!message.deletedAt;

  return (
    <div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}
    >
      <div className={`relative max-w-xs lg:max-w-md ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}           
          onMouseEnter={() => setShowOptions(true)}
          onMouseLeave={() => setShowOptions(false)}>
        {/* Sender name — only show for others' messages */}
        {!isOwn && (
          <span className="text-xs text-gray-500 mb-1 ml-1">
            {senderUsername}

          </span>
        )}

        <div
          className={`px-4 py-2 rounded-2xl text-sm ${isDeleted
            ? 'bg-gray-100 text-gray-400 italic'
            : isOwn
              ? 'bg-green-500 text-white'
              : 'bg-white text-gray-800 shadow-sm'
            }`}
        >
          {isDeleted ? 'This message was deleted' : message.content}
        </div>

        {/* Timestamp */}
        <span className="text-xs text-gray-400 mt-1 mx-1">
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>

        {/* Delete options — shown on hover, hidden for deleted messages */}
        {showOptions && !isDeleted && (
          <div
            className={`absolute -top-4 z-10 ${isOwn ? 'right-0' : 'left-0'} flex items-center gap-1 rounded-md border border-gray-200 bg-white/95 p-0.5 shadow-md backdrop-blur`}
          >
            <button
              onClick={() => deleteMe.mutate(message.id)}
              className="cursor-pointer h-auto! min-h-0! whitespace-nowrap rounded-md border border-gray-200 px-2! py-0.5! text-[11px]! leading-4! font-medium text-gray-600 transition-colors bg-white! hover:bg-red-50 hover:text-red-600"
            >
              Delete for me
            </button>
            {/* Delete for everyone — own messages always, any message if admin */}
            {(isOwn || isAdmin) && (
              <button
                onClick={() => deleteEveryone.mutate(message.id)}
                className="cursor-pointer h-auto! min-h-0! whitespace-nowrap rounded-md px-2! py-0.5! text-[11px]! leading-4! font-semibold text-white! transition-colors bg-red-500! hover:bg-red-600"
              >
                Delete for all
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};