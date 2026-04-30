import { streamText, ModelMessage } from "ai"
import { google } from "@ai-sdk/google"
import { Response } from "express"
import env from "../config/env"

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
    { role: 'assistant', content: 'I can help you with your courses, answer study questions, and provide information about your groups and deadlines.' },
]


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

        const coreMessages: ModelMessage[] = messages.map(m => {
            const isAssistant = m.role === 'assistant' || m.role === 'model';
            return {
                role: isAssistant ? 'assistant' : 'user',
                content: m.content,
            };
        });

        let iterator: AsyncIterator<string> | undefined;
        let firstChunkResult: IteratorResult<string> | undefined;

        // streamText returns an object synchronously, but the API connection is asynchronous.
        // To properly catch and retry 503/429 errors, we must explicitly await the very first 
        // chunk of the stream inside the retry wrapper.
        await withRetry(async () => {
            const result = streamText({
                model: google(env.GEMINI_MODEL),
                system: systemPrompt,
                messages: coreMessages,
            });
            
            iterator = result.textStream[Symbol.asyncIterator]();
            firstChunkResult = await iterator.next();
        });

        if (firstChunkResult && !firstChunkResult.done) {
            fullResponse += firstChunkResult.value;
            res.write(`data: ${firstChunkResult.value.replace(/\n/g, '\\n')}\n\n`);
        }

        if (iterator) {
            while (true) {
                const chunkResult = await iterator.next();
                if (chunkResult.done) break;
                
                fullResponse += chunkResult.value;
                res.write(`data: ${chunkResult.value.replace(/\n/g, '\\n')}\n\n`);
            }
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