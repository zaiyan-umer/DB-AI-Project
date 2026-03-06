import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import authRoutes from "./routes/auth.routes";
import env from './config/env';
import cookieParser from 'cookie-parser';


const app = express();

app.use(cookieParser());
app.use(helmet())
app.use(
    cors({
        origin: env.CORS_ORIGIN,
        credentials: true
    }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.get('/health', (req, res) => {
    return res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    })
})

app.use('/api/auth', authRoutes);

export default app;