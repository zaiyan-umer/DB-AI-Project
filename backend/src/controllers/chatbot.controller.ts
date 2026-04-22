import { Request, Response } from "express";
import { getGeminiModel } from '../config/gemini';
import { getPreviousMessages, saveChatbotMessage } from "../services/dal/chatbot.dal";
import { getMyGroupsFromDB } from "../services/dal/groups.dal";
import { getCoursesByUser } from "../services/dal/notes.dal";
import { AIMessageType, SAMPLE_CONVERSATION, STATIC_PROMPT, withRetry } from '../utils/ai-chatbot';

const generateAIResponseStream = async function* (
    systemPrompt: string,
    messages: AIMessageType[]
): AsyncGenerator<string> {
    const model = getGeminiModel(systemPrompt);

    const history = messages.slice(0, -1).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
    }))

    const chat = model.startChat({ history })
    const lastMessage = messages[messages.length - 1].content

    const result = await withRetry(() => chat.sendMessageStream(lastMessage))

    for await (const chunk of result.stream) {
        const text = chunk.text()
        if (text) yield text
    }
}


type PromptUser = Pick<Express.UserPayload, 'username' | 'email'>
type PromptCourse = { name: string }
type PromptGroup = { name: string }

function buildSystemPrompt({ user, courses, groups }: { user: PromptUser; courses: PromptCourse[]; groups: PromptGroup[] }) {
    const now = new Date().toLocaleString()
    const courseList = courses.map(c => c.name).join(', ')
    const groupList = groups.map(g => g.name).join(', ')

    return `
${STATIC_PROMPT}

--- User Context ---
Current date and time: ${now}
Student name: ${user.username}
Courses: ${courseList || 'No courses yet'}
Study groups: ${groupList || 'No groups yet'}

Use the above information to personalize your responses.
Only refer to information explicitly listed above. Do not invent details.
    `.trim()
}


export async function handleChatbotMessage(req: Request, res: Response) {
    try {
        const prompt = req.body.content as string;
        const user = req.user;

        if (!user) {
            return res.status(401).json({ message: 'User not authenticated' })
        }

        const userId = user.id;

        const [courses, groups] = await Promise.all([
            getCoursesByUser(userId),
            getMyGroupsFromDB(userId),
        ])

        const systemPrompt = buildSystemPrompt({ user, courses, groups })

        const prevMessages = await getPreviousMessages(userId)

        await saveChatbotMessage(userId, 'user', prompt)

        const messages: AIMessageType[] = [
            ...SAMPLE_CONVERSATION,
            ...prevMessages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: prompt }
        ]

        // SSE headers
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')
        res.flushHeaders()

        let fullResponse = ''

        for await (const chunk of generateAIResponseStream(systemPrompt, messages)) {
            fullResponse += chunk
            res.write(`data: ${chunk.replace(/\n/g, '\\n')}\n\n`)
        }

        await saveChatbotMessage(userId, 'assistant', fullResponse)

        res.write('data: [DONE]\n\n')
        res.end()

    } catch (err: any) {
        console.error(err)
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
    }
}

export async function getCopilotHistory(req: Request, res: Response) {
    try {
        const user = req.user

        if (!user) {
            return res.status(401).json({ message: 'User not authenticated' })
        }

        const messages = await getPreviousMessages(user.id)

        return res.status(200).json({
            messages: messages.map((message) => ({
                id: message.id,
                role: message.role,
                content: message.content,
                createdAt: message.createdAt,
            })),
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Failed to fetch copilot history' })
    }
}