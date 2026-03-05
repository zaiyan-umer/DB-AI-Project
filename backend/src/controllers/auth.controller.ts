import type { Request, Response } from "express"
import { newUser } from "../db/schema/user.schema";
import { hashPassword } from "../utils/hashing.utils";
import { checkExistingUser, insertUser } from "../services/dal/users.dal";

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

        return res.status(201).json({
            message: 'User created successfully',
            newUser: user
        })
    }
    catch (err) {
        console.error(err)

        return res.status(500).json({
            message: "User creation failed"
        })
    }
}