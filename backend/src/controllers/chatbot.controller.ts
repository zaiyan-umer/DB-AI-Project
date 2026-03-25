import { GoogleGenerativeAI } from '@google/generative-ai';
import { Request, Response } from "express";
import env from "../config/env";
import { getPreviousMessages, saveChatbotMessage } from "../services/dal/chatbot.dal";
import { getMyGroupsFromDB } from "../services/dal/groups.dal";
import { getCoursesByUser } from "../services/dal/notes.dal";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)

const generateAIResponse = async (systemPrompt: string, messages: { role: string, content: string }[]): Promise<string> => {
    const model = genAI.getGenerativeModel({
        model: env.GEMINI_MODEL,
        systemInstruction: systemPrompt,
    })

    const history = messages.slice(0, -1).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
    }))

    const chat = model.startChat({ history })

    // Last message is the current user message
    const lastMessage = messages[messages.length - 1].content
    const result = await chat.sendMessage(lastMessage)

    return result.response.text()
}


const STATIC_PROMPT = `You are StudySync AI, a smart academic assistant embedded inside the StudySync platform.
You help students with their coursework, 
answer general study questions, and provide information about their account and platform activity.

Keep responses concise, friendly, and helpful. If you don't know something, say so honestly.
Never make up course names, deadlines, or group information — only refer to what is provided to you.`

const SAMPLE_CONVERSATION = [
    { role: 'user', content: 'What can you help me with?' },
    { role: 'model', content: 'I can help you with your courses, answer study questions, and provide information about your groups and deadlines.' },
]


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
Student email: ${user.email}
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

        const messages = [
            ...SAMPLE_CONVERSATION,
            ...prevMessages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: prompt }
        ]

        const response = await generateAIResponse(systemPrompt, messages)

        await saveChatbotMessage(userId, 'assistant', response)

        return res.status(200).json({
            message: 'Message processed successfully',
            messages,
            response
        });
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to process message' })
    }
}