import { google } from '@ai-sdk/google';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { embedMany } from 'ai';
import { and, asc, cosineDistance, eq, lte } from 'drizzle-orm';
import fs from 'fs/promises';
import { PDFParse } from 'pdf-parse';
import env from '../config/env';
import db from '../db/connection';
import { courseFiles, documentEmbeddings } from '../db/schema';

export async function generateChunks(text: string, chunkSize: number = 4000, chunkOverlap: number = 400) {
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize,
        chunkOverlap,
    });

    const chunks = await splitter.splitText(text);

    // console.log("Chunks length: ", chunks.length);
    // console.log("Chunks: ", chunks);

    return chunks;
}

export async function extractTextFromPdf(filepath: string): Promise<string> {
    const pdf = await fs.readFile(filepath);
    const parser = new PDFParse({ data: pdf });

    try {
        const result = await parser.getText();
        const text = result.text;

        if (!text) throw new Error("Failed to extract text from PDF");
        // console.log("Text length: ", text.length);

        return text;
    } finally {
        await parser.destroy();
    }
}

export async function generateEmbeddings(texts: string[]) {
    const BATCH_SIZE = 100;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        const batch = texts.slice(i, i + BATCH_SIZE);
        const { embeddings } = await embedMany({
            model: google.embeddingModel(env.TEXT_EMBEDDING_MODEL),
            values: batch,
        });
        allEmbeddings.push(...embeddings);
    }

    return allEmbeddings;
}


type ChunksStorageType = {
    chunks: string[];
    embeddings: number[][];
    userId: string;
    fileId: string;
}
export async function storeEmbeddingsIntoDB({ chunks, embeddings, userId, fileId }: ChunksStorageType) {
    const records = chunks.map((chunk, index) => ({
        chunkText: chunk,
        embedding: embeddings[index],
        userId,
        fileId,
    }));

    return await db.insert(documentEmbeddings).values(records);
}

export async function getEmbeddingsByFile(fileId: string) {
    return await db.select().from(documentEmbeddings).where(eq(documentEmbeddings.fileId, fileId)).orderBy(asc(documentEmbeddings.createdAt))
}

export async function getEmbeddingsByUserId(userId: string) {
    return await db.select().from(documentEmbeddings).where(eq(documentEmbeddings.userId, userId)).orderBy(asc(documentEmbeddings.createdAt))
}

export async function deleteEmbeddingsByFile(fileId: string) {
    return await db.delete(documentEmbeddings).where(eq(documentEmbeddings.fileId, fileId));
}

export async function deleteEmbeddingsByUser(userId: string) {
    return await db.delete(documentEmbeddings).where(eq(documentEmbeddings.userId, userId));
}

export async function semanticSearch({ query, userId, limit }: { query: string, userId: string, limit?: number }) {
    const queryEmbed = await generateEmbeddings([query]);
    const targetVector = queryEmbed[0];

    const result = await db
        .select({
            id: documentEmbeddings.id,
            chunkText: documentEmbeddings.chunkText,
            embedding: documentEmbeddings.embedding,
            userId: documentEmbeddings.userId,
            fileId: documentEmbeddings.fileId,
            courseFile: {
                id: courseFiles.id,
                originalName: courseFiles.originalName,
                createdAt: courseFiles.createdAt,
            }
        })
        .from(documentEmbeddings)
        .leftJoin(courseFiles, eq(documentEmbeddings.fileId, courseFiles.id))
        .where(
            and(
                eq(documentEmbeddings.userId, userId),
                lte(cosineDistance(documentEmbeddings.embedding, targetVector), 1 - 0.6)
            )
        )
        .orderBy(asc(cosineDistance(documentEmbeddings.embedding, targetVector)))
        .limit(limit ?? 5);

    return result;
}