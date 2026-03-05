import { eq } from "drizzle-orm";
import db from "../../db/connection";
import users, { newUser } from "../../db/schema/user.schema";

export const insertUser = async (user: newUser, hashedPassword: string) => {
    try {
        const [createdUser] = await db.insert(users).values({
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            password: hashedPassword
        })
            .returning()

        return createdUser
    }
    catch (err) {
        console.error("insertUser failed:", err)
        throw new Error("Failed to insert user")
    }
}

export const checkExistingUser = async (email: string) => {
    try {
        const [existingUser] = await db.select().from(users).where(eq(users.email, email))

        return existingUser
    }
    catch (err) {
        console.error("checkExistingUser failed:", err)
        throw new Error("Failed to check existing user")
    }
}

export const updateUserPassword = async (userId: string, hashedPassword: string) => {
    try {
        const [updatedUser] = await db
            .update(users)
            .set({ password: hashedPassword, updatedAt: new Date() })
            .where(eq(users.id, userId))
            .returning()

        return updatedUser
    }
    catch (err) {
        console.error("updateUserPassword failed:", err)
        throw new Error("Failed to update user password")
    }
}