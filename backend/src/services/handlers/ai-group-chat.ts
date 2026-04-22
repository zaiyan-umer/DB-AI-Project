import { getGeminiModel } from "../../config/gemini";
import { getIO } from "../../socket";
import { AIMessageType, SAMPLE_CONVERSATION, STATIC_PROMPT, withRetry } from "../../utils/ai-chatbot";
import { getGroupById } from "../dal/groups.dal";
import { addNewMessage } from "../dal/messages.dal";

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

        const response = await withRetry(() => generateAIChatResponse(messages, prompt));

        
        const [savedMessage] = await addNewMessage(groupId, null, response, 'ai');
        
        // console.log("AI RESPONSE: ", response);
        // console.log("SAVED: ", savedMessage);
        
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
        console.error("AI Group Chat Error: ", err);
        getIO().to(groupId).emit('ai_typing', { groupId, isTyping: false });
    }
}


const generateAIChatResponse = async (messages: AIMessageType[], prompt: string) => {
    const model = getGeminiModel(prompt);

    const history = messages.slice(0, -1).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
    }))

    const lastMessage = messages[messages.length - 1].content
    const chat = model.startChat({ history })

    const result = await chat.sendMessage(lastMessage)
    return result.response.text()
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