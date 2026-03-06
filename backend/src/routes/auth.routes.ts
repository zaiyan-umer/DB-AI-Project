import express from 'express';
import { forgotPassword, getCurrentUser, login, logout, register, resetPassword } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validation.middleware';
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from '../zod/schema';

const router = express.Router();

router.post('/register', validateBody(registerSchema), register)
router.post('/login', validateBody(loginSchema), login)
router.post('/logout', logout)
router.post('/forgot-password', validateBody(forgotPasswordSchema), forgotPassword)
router.post('/reset-password', validateBody(resetPasswordSchema), resetPassword)
router.get('/auth/me', getCurrentUser)

export default router;