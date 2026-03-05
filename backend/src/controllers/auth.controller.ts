import type { Request, Response } from "express"
import { newUser } from "../db/schema/user.schema";
import { comparePassword, hashPassword } from "../utils/hashing.utils";
import { checkExistingUser, insertUser } from "../services/dal/users.dal";
import { generateToken } from "../utils/jwt";

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
            newUser: userWithoutPassword
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

        const isPasswordValid = await comparePassword(password, existingUser.password)

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
            token
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