import bcrypt from 'bcrypt'
import env from '../config/env'

export const hashPassword = async (password: string): Promise<string> => {
    try {
        const saltRounds = env.BCRYPT_ROUNDS || 12
        return await bcrypt.hash(password, saltRounds)
    }
    catch (err) {
        throw new Error('Password hashing failed')
    }
}

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash)
}