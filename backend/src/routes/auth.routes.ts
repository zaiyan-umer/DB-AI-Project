import express from 'express';
import { login, register } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validation.middleware';
import { loginSchema, registerSchema } from '../zod/schema';

const router = express.Router();

router.post('/register', validateBody(registerSchema), register)
router.post('/login', validateBody(loginSchema), login)

export default router;