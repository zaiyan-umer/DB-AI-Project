import { pgTable, text, uuid, varchar, vector } from "drizzle-orm/pg-core";
import users from "./user.schema";


const documentEmbeddings = pgTable("document_embeddings", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("userId").references(() => users.id, { onDelete: "cascade" }),

    pdfName: varchar("pdf_name", { length: 255 }).notNull(),
    pdfUrl: varchar("pdf_url", { length: 255 }).notNull(),

    chunkText: text("chunk_text").notNull(),

    embedding: vector("embedding", {dimensions: 768}).notNull()
})

export default documentEmbeddings;