// routes/group.routes.ts
import { Router } from 'express';
import {
    createGroup,
    getGroupMembers,
    joinGroup,
    searchGroups,
} from '../controllers/group.controller';
import { verifyToken } from '../middleware/verifyToken.middleware'; // your existing JWT middleware
import { requireGroupAdmin } from '../middleware/requireGroupAdmin.middleware';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware';
import { createGroupBodySchema, groupParamsSchema, searchGroupQuerySchema } from '../db/schema/group.schema';

const router = Router();

// All group routes require authentication
router.use(verifyToken);

router.post('/', validateBody(createGroupBodySchema), createGroup);
router.get('/search', validateQuery(searchGroupQuerySchema), searchGroups);
router.post('/:groupId/join', validateParams(groupParamsSchema), joinGroup);
router.get('/:groupId/members', validateParams(groupParamsSchema), requireGroupAdmin, getGroupMembers);

export default router;