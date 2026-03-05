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
            .returning({
                id: users.id,
                email: users.email,
                username: users.username,
                firstName: users.firstName,
                lastName: users.lastName,
            })

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