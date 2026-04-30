import env from "./env";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
export const getGeminiModel = (systemInstruction?: string) => {
    return genAI.getGenerativeModel({
        model: env.GEMINI_MODEL,
        systemInstruction: systemInstruction,
    })
}

export const getEmbeddingModel = () => {
    return genAI.getGenerativeModel({
        model: "gemini-embedding-001",
    })
}
