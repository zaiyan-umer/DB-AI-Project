import type { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export const validateBody = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const validatedData = schema.parse(req.body);
            req.body = validatedData;
            next();
        } catch (err) {
            if (err instanceof ZodError) {
                return res.status(400).json({
                    error: "Validation failed",
                    details: err.issues.map((e) => ({
                        field: e.path.join("."),
                        message: e.message,
                    })),
                });
            }
            next(err);
        }
    };
};