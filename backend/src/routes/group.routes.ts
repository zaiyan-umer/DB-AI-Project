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

const router = Router();

// All group routes require authentication
router.use(verifyToken);

router.post('/', createGroup);
router.get('/search', searchGroups);
router.post('/:groupId/join', joinGroup);
router.get('/:groupId/members', requireGroupAdmin, getGroupMembers);

export default router;