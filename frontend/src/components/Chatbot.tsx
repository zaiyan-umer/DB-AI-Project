import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X, Bot, SendHorizontal } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

type ChatMessage = {
    id: string | number
    role: 'user' | 'assistant'
    content: string
}

export interface ChatbotProps {
    messages: ChatMessage[]
    isStreaming: boolean
    onSendMessage: (content: string) => void
}

const Chatbot = ({ messages, isStreaming, onSendMessage }: ChatbotProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const [input, setInput] = useState('')
    const endRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    useEffect(() => {
        if (isOpen) {
            const timeout = setTimeout(() => {
                endRef.current?.scrollIntoView({ behavior: 'instant' })
            }, 50)
            return () => clearTimeout(timeout)
        }
    }, [isOpen])

    const shouldShowTyping = useMemo(() => {
        if (!isStreaming) return false
        const lastMessage = messages[messages.length - 1]
        if (!lastMessage) return true

        return lastMessage.role === 'user' || lastMessage.content.trim().length === 0
    }, [isStreaming, messages])

    const handleSend = () => {
        const content = input.trim()
        if (!content || isStreaming) return

        onSendMessage(content)
        setInput('')
    }

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="chatbot-panel"
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        transition={{
                            opacity: { duration: 0.2, ease: 'easeOut' },
                            scale: { type: 'spring', stiffness: 320, damping: 30, mass: 0.8 },
                            y: { type: 'spring', stiffness: 320, damping: 30, mass: 0.8 },
                        }}
                        style={{ transformOrigin: 'bottom right' }}
                        className="mb-3 flex h-125 w-90 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
                    >
                        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                            <div className="flex items-center gap-2">
                                <div className="grid h-8 w-8 place-items-center rounded-full bg-indigo-600 text-white">
                                    <Bot size={16} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">StudySync AI</p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="rounded-md p-1.5 cursor-pointer text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 duration-300"
                                aria-label="Close chatbot"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="flex-1 space-y-3 overflow-y-auto bg-white p-4">
                            {messages.map((message) => {
                                const isUser = message.role === 'user'

                                return (
                                    <motion.div
                                        key={message.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, ease: 'easeOut' }}
                                        className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[80%] px-3 py-2 text-sm rounded-2xl ${isUser
                                                ? 'rounded-br-md bg-indigo-600 text-white'
                                                : 'rounded-bl-md bg-slate-100 text-slate-800'
                                                }`}
                                        >
                                            {isUser ? (
                                                <span className="whitespace-pre-wrap wrap-break-word">{message.content}</span>
                                            ) : (
                                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkMath]}
                                                        rehypePlugins={[rehypeKatex]}
                                                    >
                                                        {message.content}
                                                    </ReactMarkdown>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )
                            })}

                            {shouldShowTyping && (
                                <div className="flex justify-start">
                                    <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-slate-100 px-3 py-2">
                                        {[0, 1, 2].map((index) => (
                                            <motion.span
                                                key={index}
                                                className="h-1.5 w-1.5 rounded-full bg-slate-500"
                                                animate={{ y: [0, -4, 0] }}
                                                transition={{
                                                    duration: 0.8,
                                                    repeat: Infinity,
                                                    ease: 'easeInOut',
                                                    delay: index * 0.15,
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div ref={endRef} />
                        </div>

                        <div className="bg-white p-3">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            handleSend()
                                        }
                                    }}
                                    placeholder="Ask StudySync AI..."
                                    disabled={isStreaming}
                                    className="h-10 flex-1 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-slate-100"
                                />

                                <button
                                    type="button"
                                    onClick={handleSend}
                                    disabled={isStreaming || !input.trim()}
                                    className="inline-flex h-10 w-20 items-center justify-center gap-1 rounded-lg bg-indigo-600 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
                                >
                                    <span>Send</span>
                                    <span className='flex items-center justify-center mt-1'>
                                        <SendHorizontal size={12} />
                                    </span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {
                !isOpen && (

                    <button
                        type="button"
                        onClick={() => setIsOpen((prev) => !prev)}
                        className="grid cursor-pointer h-14 w-14 place-items-center rounded-full bg-indigo-600 text-white shadow-lg transition hover:bg-indigo-500 duration-200"
                        aria-label={isOpen ? 'Close StudySync AI' : 'Open StudySync AI'}
                    >
                        <motion.span>
                            <Bot size={22} />
                        </motion.span>
                    </button>
                )
            }
        </div>
    )
}

export default Chatbot
