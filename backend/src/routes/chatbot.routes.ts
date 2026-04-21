import express from 'express';
import { validateBody } from '../middleware/validation.middleware';
import { verifyToken } from '../middleware/verifyToken.middleware';
import { getCopilotHistory, handleChatbotMessage } from '../controllers/chatbot.controller';
import { insertChatbotMessageSchema } from '../db/schema/chatbot_messages.schema';
const router = express.Router();

const chatbotMessageBodySchema = insertChatbotMessageSchema.pick({ content: true })

router.post('/', verifyToken, validateBody(chatbotMessageBodySchema), handleChatbotMessage)
router.get('/history', verifyToken, getCopilotHistory)

export default router;