import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import env from "../config/env";

const isUserPayload = (payload: jwt.JwtPayload): payload is Express.UserPayload => {
    return (
        typeof payload.id === "string" &&
        typeof payload.username === "string" &&
        typeof payload.email === "string"
    );
};

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET);

        if (typeof decoded === "string" || !isUserPayload(decoded)) {
            return res.status(401).json({ error: "Invalid token payload" });
        }

        req.user = decoded;
        next();
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ error: "Token expired" });
        }
        if (err instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ error: "Invalid token" });
        }
        next(err); // unexpected error, let the error handler deal with it
    }
};