import dotenv from 'dotenv'
dotenv.config({quiet: true})

export const ENV = {
    BACKENDPORT: process.env.BACKEND_PORT,
    FRONTEND_URL: process.env.FRONTEND_URL
}
