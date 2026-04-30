import { google } from "@ai-sdk/google";
import { generateText, ModelMessage } from "ai";
import env from "../../config/env";
import { getIO } from "../../socket";
import { AIMessageType, SAMPLE_CONVERSATION, withRetry } from "../../utils/ai-chatbot.utils";
import { AI_HELP_MESSAGE, STATIC_PROMPT } from "../../utils/data";
import { getGroupById } from "../dal/groups.dal";
import { addNewMessage, fetchMessages } from "../dal/messages.dal";

export const aiChatHandler = async (groupId: string, content: string) => {
    try {
        const [group] = await getGroupById(groupId);
        if (!group) throw new Error("Group not found");

        const prompt = buildSystemPrompt(group.name);

        const messages: AIMessageType[] = [
            ...SAMPLE_CONVERSATION,
            { role: 'user', content: content }
        ]
        getIO().to(groupId).emit('ai_typing', { groupId, isTyping: true });

        let response: string;
        const args = content.split(' ');
        const command = args[0].toLowerCase()

        if (command === 'help') {
            response = AI_HELP_MESSAGE;
        }
        else if (command === 'summarize') {
            const n = Number(args[1]);

            // Validating that the input is valid num
            if (!args[1] || isNaN(n) || n <= 0) {
                response = "Please provide a valid number of messages to summarize. (e.g. @ai summarize 10)";
            }
            else if (n > 20) {
                response = "I cannot summarize more than 20 messages"
            }
            else {
                const msgs = await fetchMessages(groupId, Number(n));

                const chatText = msgs.map(m => `${m.senderType}: ${m.content}`).join('\n')
                // Create a custom prompt just for summarization
                const summaryPrompt = `Please summarize the following chat history:\n\n${chatText}`;
                
                const summaryMessages: AIMessageType[] = [
                    { role: 'user', content: summaryPrompt }
                ];

                response = await withRetry(() => generateAIChatResponse(summaryMessages, prompt));
            }
        }
        else {
            response = await withRetry(() => generateAIChatResponse(messages, prompt));
        }

        const [savedMessage] = await addNewMessage(groupId, null, response, 'ai');

        const messagePayload = {
            id: savedMessage.id,
            groupId: savedMessage.groupId,
            content: savedMessage.content,
            createdAt: savedMessage.createdAt,
            senderType: 'ai',
            sender: null
        };

        getIO().to(groupId).emit('new_message', messagePayload);
        getIO().to(groupId).emit('ai_typing', { groupId, isTyping: false });

        return response;
    }
    catch (err) {
        console.error("MODEL: ", env.GEMINI_MODEL);
        console.error("AI Group Chat Error: ", err);
        getIO().to(groupId).emit('ai_typing', { groupId, isTyping: false });
    }
}


const generateAIChatResponse = async (messages: AIMessageType[], prompt: string) => {
    const coreMessages: ModelMessage[] = messages.map(m => {
        const isAssistant = m.role === 'assistant' || m.role === 'model';
        return {
            role: isAssistant ? 'assistant' : 'user',
            content: m.content,
        };
    });

    const startTime = performance.now();

    const { text } = await generateText({
        model: google(env.GEMINI_MODEL),
        system: prompt,
        messages: coreMessages,
        maxRetries: 0, // Disable Vercel's internal hidden retries
    });

    const endTime = performance.now();
    console.log(`\n⏱️  [AI Latency] Gemini API call took ${((endTime - startTime) / 1000).toFixed(2)} seconds\n`);

    return text;
}


const buildSystemPrompt = (groupName: string) => {
    return `
${STATIC_PROMPT}

--- Group Context ---
Group Name: ${groupName}

Use the above information to personalize your responses.
Only refer to information explicitly listed above. Do not invent details.
    `.trim()
}