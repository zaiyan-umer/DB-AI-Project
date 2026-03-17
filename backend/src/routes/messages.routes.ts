import { Router } from 'express';
import { deleteForEveryone, deleteForMe, getMessages, sendMessage } from '../controllers/messages.controller';
import {
    getMessagesQuerySchema,
    groupParamsSchema,
    messageParamsSchema,
    sendMessageBodySchema,
} from '../db/schema/messages.schema';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware';
import { verifyToken } from '../middleware/verifyToken.middleware';

const router = Router({ mergeParams: true });

router.use(verifyToken);

router.post(
    '/',
    validateParams(groupParamsSchema),
    validateBody(sendMessageBodySchema),
    sendMessage
);

router.get(
    '/',
    validateParams(groupParamsSchema),
    validateQuery(getMessagesQuerySchema),
    getMessages
);

router.delete(
    '/:messageId',
    validateParams(messageParamsSchema),
    deleteForMe
);

router.delete(
    '/:messageId/everyone',
    validateParams(messageParamsSchema),
    deleteForEveryone
);

export default router;