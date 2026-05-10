import { Router } from 'express';
import { verifyToken } from '../middleware/verifyToken.middleware';
import { getWhiteboard, updateWhiteboard } from '../controllers/board.controller';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import { z } from 'zod';
import { insertWhiteboardSchema } from '../db/schema/whiteboard.schema';

const router = Router();

router.use(verifyToken)


router.get("/:groupId", validateParams(z.object({ groupId: z.string() })), getWhiteboard);
router.put("/:groupId", validateParams(z.object({ groupId: z.string(), userId: z.string() })), validateBody(insertWhiteboardSchema), updateWhiteboard);


export default router
