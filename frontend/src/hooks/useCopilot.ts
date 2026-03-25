import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/axios'

export type Message = {
	id: string | number
	role: 'user' | 'assistant'
	content: string
}

type HistoryApiMessage = {
	id?: string | number
	_id?: string | number
	role?: unknown
	content?: unknown
}

type HistoryApiResponse = {
	messages?: unknown
}

const toMessageList = (payload: unknown): Message[] => {
	const maybeArray = Array.isArray(payload)
		? payload
		: typeof payload === 'object' && payload !== null && Array.isArray((payload as HistoryApiResponse).messages)
		  ? (payload as HistoryApiResponse).messages
		  : []

	return maybeArray.map((item, index) => {
		const record = (typeof item === 'object' && item !== null ? item : {}) as HistoryApiMessage

		return {
			id: record.id ?? record._id ?? `history-${index}`,
			role: record.role === 'assistant' ? 'assistant' : 'user',
			content: typeof record.content === 'string' ? record.content : '',
		}
	})
}

export const useCopilot = () => {
	const [messages, setMessages] = useState<Message[]>([])
	const [isStreaming, setIsStreaming] = useState(false)
	const didSeedHistoryRef = useRef(false)

	const { data: historyData, isLoading: isLoadingHistory } = useQuery({
		queryKey: ['copilot-history'],
		queryFn: async () => {
			const { data } = await api.get('/ai/chatbot/history')
			return data
		},
	})

	useEffect(() => {
		if (didSeedHistoryRef.current) return
		if (historyData === undefined) return

		setMessages(toMessageList(historyData))
		didSeedHistoryRef.current = true
	}, [historyData])

	const sendMessage = async (content: string) => {
		const trimmedContent = content.trim()
		if (!trimmedContent) return

		const now = Date.now()
		const userMessageId = `user-${now}`
		const placeholderId = `assistant-${now}-placeholder`

		setMessages((prev) => [
			...prev,
			{ id: userMessageId, role: 'user', content: trimmedContent },
			{ id: placeholderId, role: 'assistant', content: '' },
		])
		setIsStreaming(true)

		try {
			const response = await fetch('http://localhost:8000/api/ai/chatbot', {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ content: trimmedContent }),
			})

			if (!response.ok || !response.body) {
				throw new Error('Failed to start chatbot stream')
			}

			const reader = response.body.getReader()
			const decoder = new TextDecoder()
			let buffer = ''
			let shouldStop = false

			while (!shouldStop) {
				const { done, value } = await reader.read()
				if (done) break

				buffer += decoder.decode(value, { stream: true })
				const lines = buffer.split('\n')
				buffer = lines.pop() ?? ''

				for (const rawLine of lines) {
					const line = rawLine.trim()
					if (!line.startsWith('data:')) continue

					const payload = line.replace(/^data:\s?/, '').replace(/\\n/g, '\n')

					if (payload === '[DONE]') {
						shouldStop = true
						break
					}

					if (payload.startsWith('[ERROR]')) {
						setMessages((prev) =>
							prev.map((m) =>
								m.id === placeholderId
									? { ...m, content: 'Something went wrong, Please try again' }
									: m,
							),
						)
						shouldStop = true
						break
					}

					setMessages((prev) =>
						prev.map((m) =>
							m.id === placeholderId
								? { ...m, content: m.content + payload }
								: m,
						),
					)
				}
			}
		} catch {
			setMessages((prev) =>
				prev.map((m) =>
					m.id === placeholderId
						? { ...m, content: 'Something went wrong, please try again' }
						: m,
				),
			)
		} finally {
			setIsStreaming(false)
		}
	}

	return {
		messages,
		isStreaming,
		sendMessage,
		isLoadingHistory,
	}
}

export default useCopilot
