import { ChatSession } from "@google/generative-ai"
import { Response } from "express"
import { getGeminiModel } from "../config/gemini"

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// exponential backoff function
export const withRetry = async <T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 1000
): Promise<T> => {
    let lastError: any

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn()
        } catch (err: any) {
            lastError = err
            const isRetryable = err?.status === 503 || err?.status === 429

            if (!isRetryable || attempt === maxAttempts) throw err

            const delay = baseDelay * attempt
            console.warn(`Gemini attempt ${attempt} failed with ${err.status}. Retrying in ${delay}ms...`)
            await sleep(delay)
        }
    }

    throw lastError
}

export type AIMessageType = {
    role: 'user' | 'model' | 'assistant';
    content: string;
}

export const SAMPLE_CONVERSATION: AIMessageType[] = [
    { role: 'user', content: 'What can you help me with?' },
    { role: 'model', content: 'I can help you with your courses, answer study questions, and provide information about your groups and deadlines.' },
]

export const initializeChatSession = 
    (systemPrompt: string, messages: AIMessageType[]): [ChatSession, string] => {
    const model = getGeminiModel(systemPrompt);

    const history = messages.slice(0, -1).map(m => {
        const isAssistant = m.role === 'assistant' || m.role === 'model';

        return {
            role: isAssistant ? 'model' : 'user',
            parts: [{ text: m.content }],
        };
    });

    const chat = model.startChat({ history })
    const lastMessage = messages[messages.length - 1].content

    return [chat, lastMessage]
}


const generateAIResponseStream = async function* (
    systemPrompt: string,
    messages: AIMessageType[]
): AsyncGenerator<string> {
    const [chat, lastMessage] = initializeChatSession(systemPrompt, messages);

    const result = await withRetry(() => chat.sendMessageStream(lastMessage))

    for await (const chunk of result.stream) {
        const text = chunk.text()
        if (text) yield text
    }
}

type StreamResponseToClientsPayload = {
    res: Response
    systemPrompt: string
    messages: AIMessageType[]
}
export const streamResponseToClients = 
    async ({res, systemPrompt, messages} : StreamResponseToClientsPayload): Promise<string> => {
    try{
        // SSE Headers
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')
        res.flushHeaders()

        let fullResponse = ''

        for await (const chunk of generateAIResponseStream(systemPrompt, messages)) {
            fullResponse += chunk
            res.write(`data: ${chunk.replace(/\n/g, '\\n')}\n\n`)
        }

        // SSE Done
        res.write('data: [DONE]\n\n')

        return fullResponse
    }catch(err: any){
        const isAIUnavailable = err?.status === 503 || err?.status === 429

        // If headers already sent, we can't send a JSON error response
        // so we signal the error through the stream instead
        if (res.headersSent) {
            res.write(`data: [ERROR] ${isAIUnavailable ? 'AI is currently busy' : 'Something went wrong'}\n\n`)
            res.end()
        } else {
            res.status(isAIUnavailable ? 503 : 500).json({
                message: isAIUnavailable
                    ? 'AI is currently busy, please try again shortly'
                    : 'Failed to process message'
            })
        }
        throw err;
    }
}