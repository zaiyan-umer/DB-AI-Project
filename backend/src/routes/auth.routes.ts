import express from 'express';
import { forgotPassword, getCurrentUser, login, logout, register, resetPassword } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validation.middleware';
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from '../zod/schema';
import { verifyToken } from '../middleware/verifyToken.middleware';

const router = express.Router();

router.post('/me', verifyToken, getCurrentUser)
router.post('/register', validateBody(registerSchema), register)
router.post('/login', validateBody(loginSchema), login)
router.post('/logout', logout)
router.post('/forgot-password', validateBody(forgotPasswordSchema), forgotPassword)
router.post('/reset-password', validateBody(resetPasswordSchema), resetPassword)

export default router;