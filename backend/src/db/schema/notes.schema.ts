import {
    pgTable, uuid, varchar, integer, boolean, timestamp, text, pgEnum
} from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import users from './user.schema'

// ---- Enums ----------------------------------------------------------------

export const mcqDifficultyEnum = pgEnum('mcq_difficulty', [
    'easy',
    'medium',
    'hard'
])

// ---- courses --------------------------------------------------------------
// One row per course a user creates.
// FK: user_id → users.id (cascade delete)

export const courses = pgTable('courses', {
    id:        uuid('id').primaryKey().defaultRandom(),
    userId:    uuid('user_id')
                   .references(() => users.id, { onDelete: 'cascade' })
                   .notNull(),
    name:      varchar('name', { length: 150 }).notNull(),
    // Tailwind gradient class stored as string e.g. "from-blue-500 to-cyan-500"
    color:     varchar('color', { length: 60 }).notNull().default('from-indigo-500 to-purple-500'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type Course    = typeof courses.$inferSelect
export type NewCourse = typeof courses.$inferInsert

export const insertCourseSchema = createInsertSchema(courses)
export const selectCourseSchema = createSelectSchema(courses)

export default courses

// ---- course_files ---------------------------------------------------------
// Metadata for each file a user uploads to a course.
// Actual bytes live on disk/object-storage; this table stores the reference.
// FK: course_id → courses.id (cascade delete)
// FK: user_id   → users.id  (cascade delete)

export const courseFiles = pgTable('course_files', {
    id:           uuid('id').primaryKey().defaultRandom(),
    courseId:     uuid('course_id')
                      .references(() => courses.id, { onDelete: 'cascade' })
                      .notNull(),
    userId:       uuid('user_id')
                      .references(() => users.id, { onDelete: 'cascade' })
                      .notNull(),
    originalName: varchar('original_name', { length: 255 }).notNull(),
    storagePath:  varchar('storage_path', { length: 500 }).notNull(),
    mimeType:     varchar('mime_type', { length: 100 }).notNull(),
    sizeBytes:    integer('size_bytes').notNull().default(0),
    // Ready for AI integration in iteration 3 — set true once AI processes this file
    aiProcessed:  boolean('ai_processed').notNull().default(false),
    createdAt:    timestamp('created_at').notNull().defaultNow(),
})

export type CourseFile    = typeof courseFiles.$inferSelect
export type NewCourseFile = typeof courseFiles.$inferInsert

export const insertCourseFileSchema = createInsertSchema(courseFiles)
export const selectCourseFileSchema = createSelectSchema(courseFiles)

// ---- flashcards -----------------------------------------------------------
// One row per flashcard.
// FK: course_id      → courses.id     (cascade delete)
// FK: user_id        → users.id       (cascade delete)
// FK: source_file_id → course_files.id (set null if file deleted)
//     Kept for AI iteration 3 — tracks which file generated this card

export const flashcards = pgTable('flashcards', {
    id:           uuid('id').primaryKey().defaultRandom(),
    courseId:     uuid('course_id')
                      .references(() => courses.id, { onDelete: 'cascade' })
                      .notNull(),
    userId:       uuid('user_id')
                      .references(() => users.id, { onDelete: 'cascade' })
                      .notNull(),
    sourceFileId: uuid('source_file_id')
                      .references(() => courseFiles.id, { onDelete: 'set null' }),
    question:     text('question').notNull(),
    answer:       text('answer').notNull(),
    aiGenerated:  boolean('ai_generated').notNull().default(false),
    createdAt:    timestamp('created_at').notNull().defaultNow(),
    updatedAt:    timestamp('updated_at').notNull().defaultNow(),
})

export type Flashcard    = typeof flashcards.$inferSelect
export type NewFlashcard = typeof flashcards.$inferInsert

export const insertFlashcardSchema = createInsertSchema(flashcards)
export const selectFlashcardSchema = createSelectSchema(flashcards)

// ---- mcqs -----------------------------------------------------------------
// Multiple-choice questions.
// correctOption is 0-based index into the options array.
// options stored as JSON string to avoid an extra join table.
// FK: course_id      → courses.id     (cascade delete)
// FK: user_id        → users.id       (cascade delete)
// FK: source_file_id → course_files.id (set null if file deleted)

export const mcqs = pgTable('mcqs', {
    id:            uuid('id').primaryKey().defaultRandom(),
    courseId:      uuid('course_id')
                       .references(() => courses.id, { onDelete: 'cascade' })
                       .notNull(),
    userId:        uuid('user_id')
                       .references(() => users.id, { onDelete: 'cascade' })
                       .notNull(),
    sourceFileId:  uuid('source_file_id')
                       .references(() => courseFiles.id, { onDelete: 'set null' }),
    question:      text('question').notNull(),
    // JSON string e.g. '["Option A","Option B","Option C","Option D"]'
    options:       text('options').notNull(),
    correctOption: integer('correct_option').notNull(),
    explanation:   text('explanation'),
    difficulty:    mcqDifficultyEnum('difficulty').notNull().default('medium'),
    aiGenerated:   boolean('ai_generated').notNull().default(false),
    createdAt:     timestamp('created_at').notNull().defaultNow(),
    updatedAt:     timestamp('updated_at').notNull().defaultNow(),
})

export type Mcq    = typeof mcqs.$inferSelect
export type NewMcq = typeof mcqs.$inferInsert

export const insertMcqSchema = createInsertSchema(mcqs)
export const selectMcqSchema = createSelectSchema(mcqs)

// ---- mcq_attempts ---------------------------------------------------------
// Tracks each time a user answers an MCQ.
// Used for progress analytics in future iterations.
// FK: mcq_id  → mcqs.id  (cascade delete)
// FK: user_id → users.id (cascade delete)

export const mcqAttempts = pgTable('mcq_attempts', {
    id:             uuid('id').primaryKey().defaultRandom(),
    mcqId:          uuid('mcq_id')
                        .references(() => mcqs.id, { onDelete: 'cascade' })
                        .notNull(),
    userId:         uuid('user_id')
                        .references(() => users.id, { onDelete: 'cascade' })
                        .notNull(),
    selectedOption: integer('selected_option').notNull(),
    isCorrect:      boolean('is_correct').notNull(),
    attemptedAt:    timestamp('attempted_at').notNull().defaultNow(),
})

export type McqAttempt    = typeof mcqAttempts.$inferSelect
export type NewMcqAttempt = typeof mcqAttempts.$inferInsert

export const insertMcqAttemptSchema = createInsertSchema(mcqAttempts)
export const selectMcqAttemptSchema = createSelectSchema(mcqAttempts)