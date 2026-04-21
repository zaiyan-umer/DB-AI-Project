import { useEffect, useRef, useState } from 'react';
import { useMessages, useSendMessage } from '../../hooks/useMessages';
import { MessageItem } from './MessageItem';
import { useAITyping } from '../../hooks/useAITyping';
import { Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  groupId: string;
  groupName: string;
  currentUserId: string;
  isAdmin: boolean;
  onlineCount: number
}

export const ChatWindow = ({ groupId, groupName, currentUserId, isAdmin, onlineCount }: Props) => {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useMessages(groupId);

  const sendMessage = useSendMessage(groupId);
  const isAITyping = useAITyping(groupId);

  // Flatten all pages into a single message array
  const allMessages = data?.pages.flatMap((page) => page.messages) ?? [];

  // Scroll to bottom on new messages or when AI starts typing
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages.length, isAITyping]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    sendMessage.mutate(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Loading messages...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-white flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold text-sm">
          {groupName[0].toUpperCase()}
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-gray-800">{groupName}</span>
          <span className="text-xs text-green-500">{onlineCount} online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 bg-gray-50">
        {/* Load more */}
        {hasNextPage && (
          <div className="flex justify-center mb-4">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="text-xs text-gray-500 hover:text-gray-700 bg-white border rounded-full px-3 py-1 shadow-sm"
            >
              {isFetchingNextPage ? 'Loading...' : 'Load older messages'}
            </button>
          </div>
        )}

        {allMessages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            groupId={groupId}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
          />
        ))}

        <AnimatePresence>
          {isAITyping && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex justify-start mb-2"
            >
              <div className="relative max-w-xs lg:max-w-md items-start flex flex-col">
                <span className="text-xs text-gray-500 mb-1 ml-1"><Bot size={22}/></span>
                <div className="bg-white text-gray-800 border rounded-2xl px-3 py-1 shadow-sm rounded-bl-sm flex gap-1 items-center h-8">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t bg-white flex gap-2 items-end">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 resize-none border rounded-2xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sendMessage.isPending}
          className="cursor-pointer bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-full px-4 py-2 text-sm font-medium"
        >
          Send
        </button>
      </div>
    </div>
  );
};