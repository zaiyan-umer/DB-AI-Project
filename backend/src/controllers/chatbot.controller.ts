import { Request, Response } from "express";

export async function handleChatbotMessage(req: Request, res: Response){
    console.log(req.user);
    return res.status(200).json({
        message: "Message received",
    });
}