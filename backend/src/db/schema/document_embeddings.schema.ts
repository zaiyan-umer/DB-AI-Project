import { pgTable, text, timestamp, uuid, vector } from "drizzle-orm/pg-core";
import { courseFiles } from "./notes.schema";

// document_embeddings stores vector embeddings of text chunks from course files.
// Used by the AI Chatbot for Retrieval-Augmented Generation (RAG).
// User is derived via: document_embeddings.file_id → course_files.course_id → courses.user_id

const documentEmbeddings = pgTable("document_embeddings", {
    id:        uuid("id").primaryKey().defaultRandom(),
    fileId:    uuid("file_id")
                   .references(() => courseFiles.id, { onDelete: "cascade" })
                   .notNull(),
    chunkText: text("chunk_text").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    embedding: vector("embedding", { dimensions: 3072 }).notNull(),
})

export default documentEmbeddings;