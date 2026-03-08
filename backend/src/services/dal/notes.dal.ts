import { and, eq, sql } from 'drizzle-orm'
import db from '../../db/connection'
import { courses, courseFiles, flashcards, mcqs, mcqAttempts } from '../../db/schema'
import type { NewCourse, NewCourseFile, NewFlashcard, NewMcq, NewMcqAttempt } from '../../db/schema/notes.schema'

// ---- Courses --------------------------------------------------------------

export const getCoursesByUser = async (userId: string) => {
    return db.select().from(courses).where(eq(courses.userId, userId))
}

export const getCourseById = async (courseId: string, userId: string) => {
    const [course] = await db
        .select()
        .from(courses)
        .where(and(eq(courses.id, courseId), eq(courses.userId, userId)))
    return course ?? null
}

export const insertCourse = async (payload: NewCourse) => {
    const [created] = await db.insert(courses).values(payload).returning()
    return created
}

export const removeCourse = async (courseId: string, userId: string) => {
    const [deleted] = await db
        .delete(courses)
        .where(and(eq(courses.id, courseId), eq(courses.userId, userId)))
        .returning()
    return deleted
}

export const getCourseCounts = async (courseId: string) => {
    const [fileCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(courseFiles)
        .where(eq(courseFiles.courseId, courseId))

    const [flashcardCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(flashcards)
        .where(eq(flashcards.courseId, courseId))

    const [mcqCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(mcqs)
        .where(eq(mcqs.courseId, courseId))

    return {
        filesCount:      fileCount?.count      ?? 0,
        flashcardsCount: flashcardCount?.count  ?? 0,
        mcqsCount:       mcqCount?.count        ?? 0,
    }
}

// ---- Course Files ---------------------------------------------------------

export const getFilesByCourse = async (courseId: string, userId: string) => {
    return db
        .select()
        .from(courseFiles)
        .where(and(eq(courseFiles.courseId, courseId), eq(courseFiles.userId, userId)))
}

export const getFileById = async (fileId: string, userId: string) => {
    const [file] = await db
        .select()
        .from(courseFiles)
        .where(and(eq(courseFiles.id, fileId), eq(courseFiles.userId, userId)))
    return file ?? null
}

export const insertFile = async (payload: NewCourseFile) => {
    const [created] = await db.insert(courseFiles).values(payload).returning()
    return created
}

export const removeFile = async (fileId: string, userId: string) => {
    const [deleted] = await db
        .delete(courseFiles)
        .where(and(eq(courseFiles.id, fileId), eq(courseFiles.userId, userId)))
        .returning()
    return deleted
}

// ---- Flashcards -----------------------------------------------------------

export const getFlashcardsByCourse = async (courseId: string, userId: string) => {
    return db
        .select()
        .from(flashcards)
        .where(and(eq(flashcards.courseId, courseId), eq(flashcards.userId, userId)))
}

export const insertFlashcard = async (payload: NewFlashcard) => {
    const [created] = await db.insert(flashcards).values(payload).returning()
    return created
}

export const updateFlashcard = async (
    flashcardId: string,
    userId: string,
    data: { question?: string; answer?: string }
) => {
    const [updated] = await db
        .update(flashcards)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(flashcards.id, flashcardId), eq(flashcards.userId, userId)))
        .returning()
    return updated
}

export const removeFlashcard = async (flashcardId: string, userId: string) => {
    const [deleted] = await db
        .delete(flashcards)
        .where(and(eq(flashcards.id, flashcardId), eq(flashcards.userId, userId)))
        .returning()
    return deleted
}

// ---- MCQs -----------------------------------------------------------------

export const getMcqsByCourse = async (courseId: string, userId: string) => {
    return db
        .select()
        .from(mcqs)
        .where(and(eq(mcqs.courseId, courseId), eq(mcqs.userId, userId)))
}

export const getMcqById = async (mcqId: string, userId: string) => {
    const [mcq] = await db
        .select()
        .from(mcqs)
        .where(and(eq(mcqs.id, mcqId), eq(mcqs.userId, userId)))
    return mcq ?? null
}

export const insertMcq = async (payload: NewMcq) => {
    const [created] = await db.insert(mcqs).values(payload).returning()
    return created
}

export const updateMcq = async (
    mcqId: string,
    userId: string,
    data: Partial<Pick<NewMcq, 'question' | 'options' | 'correctOption' | 'explanation' | 'difficulty'>>
) => {
    const [updated] = await db
        .update(mcqs)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(mcqs.id, mcqId), eq(mcqs.userId, userId)))
        .returning()
    return updated
}

export const removeMcq = async (mcqId: string, userId: string) => {
    const [deleted] = await db
        .delete(mcqs)
        .where(and(eq(mcqs.id, mcqId), eq(mcqs.userId, userId)))
        .returning()
    return deleted
}

// ---- MCQ Attempts ---------------------------------------------------------

export const insertMcqAttempt = async (payload: NewMcqAttempt) => {
    const [created] = await db.insert(mcqAttempts).values(payload).returning()
    return created
}