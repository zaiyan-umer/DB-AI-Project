import crypto from "crypto";
import type { Request, Response } from "express";
import { newUser } from "../db/schema/user.schema";
import { deleteToken, getToken, insertToken } from "../services/dal/tokens.dal";
import { checkExistingUser, getUserById, insertUser, updateUserPassword } from "../services/dal/users.dal";
import { compareHash, hashPassword, hashResetToken } from "../utils/hashing.utils";
import { generateToken } from "../utils/jwt";
import { sendForgotPasswordEmail } from "../utils/mailer";


export const register = async (req: Request<any, any, newUser>, res: Response) => {
    try {
        const existingUser = await checkExistingUser(req.body.email)

        if (existingUser) {
            return res.status(409).json({
                message: "Email already in use"
            })
        }

        const hashedPassword = await hashPassword(req.body.password)

        const user = await insertUser({ ...req.body }, hashedPassword)

        const { password, ...userWithoutPassword } = user;

        return res.status(201).json({
            message: 'User created successfully',
            user: userWithoutPassword
        })
    }
    catch (err) {
        console.error(err)

        return res.status(500).json({
            message: "User creation failed"
        })
    }
}

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body
        const existingUser = await checkExistingUser(email)

        if (!existingUser) {
            return res.status(401).json({
                message: "Invalid Credentials"
            })
        }

        const isPasswordValid = await compareHash(password, existingUser.password)

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid Credentials"
            })
        }

        const token = generateToken({
            id: existingUser.id,
            email: existingUser.email,
            username: existingUser.username as string
        });

        const { password: _, ...userWithoutPassword } = existingUser;

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 1000 * 60 * 60 * 24
        });

        res.status(200).json({
            message: 'User logged-in successfully',
            user: userWithoutPassword,
        });
    }
    catch (err) {
        console.error(err)

        return res.status(500).json({
            message: "Login failed"
        })
    }
}

export const logout = async (req: Request, res: Response) => {
    try {
        res.clearCookie('token')
        return res.status(200).json({
            message: 'User logged-out successfully',
        });
    }
    catch (err) {
        console.error(err)

        return res.status(500).json({
            message: "Logout failed"
        })
    }
}

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body

        const existingUser = await checkExistingUser(email)

        if (!existingUser) {
            return res.status(401).json({
                message: "Invalid Credentials"
            })
        }

        const rawToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = hashResetToken(rawToken);

        await insertToken(existingUser.id, hashedToken)

        const { error } = await sendForgotPasswordEmail('k240771@nu.edu.pk', 'zaiyan', rawToken)

        if (error) {
            console.error('Resend error:', error)
            return res.status(502).json({
                message: 'Email provider rejected the request',
                error: error.message
            })
        }

        return res.status(200).json({
            message: 'Forgot-password email sent successfully'
        })
    } catch (err) {
        console.error(err)

        return res.status(500).json({
            message: "Failed to send forgot-password email"
        })
    }
}

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token: rawToken, password } = req.body
        const hashedToken = hashResetToken(rawToken)

        const [token] = await getToken(hashedToken)

        if (!token) {
            return res.status(400).json({
                message: "Invalid or expired reset token"
            })
        }

        // Check if token is expired
        if (new Date() > new Date(token.expiresAt)) {
            await deleteToken(token.id)
            return res.status(400).json({
                message: "Reset token has expired"
            })
        }

        // Update user password
        const hashedPassword = await hashPassword(password)
        await updateUserPassword(token.userId, hashedPassword)

        // Delete the used token
        await deleteToken(token.id)

        return res.status(200).json({
            message: "Password reset successfully"
        })
    }
    catch (err) {
        console.error(err)

        return res.status(500).json({
            message: "Failed to reset password"
        })
    }
}

export const getCurrentUser = async (req: Request, res: Response) => {
    try {
        const { user } = req.body

        const currentUser = await getUserById(user.id);

        if (!currentUser) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json({
            user: currentUser
        });
    }
    catch (err) {
        console.error(err)

        return res.status(500).json({
            message: "Current user retrieval failed"
        })
    }
}
