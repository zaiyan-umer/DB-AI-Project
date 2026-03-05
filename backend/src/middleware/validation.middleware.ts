import type { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError, ZodIssue } from "zod/v3";

export const validateBody = async (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const validatedData = schema.parse(req.body)
            req.body = validatedData
            next()
        }
        catch (err) {
            if (err instanceof ZodError) {
                const zodError = err as ZodError<any>
                return res.status(400).json({
                    error: 'Validation failed',
                    details: zodError.errors.map((e: ZodIssue) => ({
                        field: e.path.join('.'),
                        message: e.message,
                    })),
                })
            }
            next(err)
        }
    }
}