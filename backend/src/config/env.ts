import dotenv from 'dotenv'
dotenv.config({ quiet: true })

import { z } from 'zod'

const envSchema = z.object({
    APP_STAGE: z.enum(['dev', 'prod']).default('dev'),
    NODE_ENV: z.enum(['development', 'production']).default('development'),
    HOST: z.string().default('localhost'),
    BACKEND_PORT: z.coerce.number().positive().default(8000),
    DATABASE_URL: z.string().startsWith("postgresql://"),
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRY: z.string().default('7d'),
    BCRYPT_ROUNDS: z.coerce.number().min(10).max(20).default(12),
    RESEND_API_KEY: z.string(),
    MAIL_SENDER: z.email(),
    CORS_ORIGIN: z
        .string()
        .or(z.array(z.string()))
        .transform((val) => {
            if (typeof val === 'string') {
                return val.split(',').map((origin) => origin.trim())
            }
            return val
        })
        .default([]),
})

export type ENV = z.infer<typeof envSchema>

let env: ENV

try {
    env = envSchema.parse(process.env)
}
catch (error) {
    if (error instanceof z.ZodError) {
        console.error("❌ Invalid environment variables:");

        for (const issue of error.issues) {
            console.error(`  ${issue.path.join(".")}: ${issue.message}`);
        }

        process.exit(1);
    } else {
        console.error('❌ Unexpected error loading environment:', error)
        process.exit(1)
    }
}

export const isProd = () => env.NODE_ENV === 'production'
export const isDev = () => env.NODE_ENV === 'development'

export { env }
export default env