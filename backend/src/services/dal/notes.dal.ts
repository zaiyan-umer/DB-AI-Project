import { and, eq, sql, lt, asc } from 'drizzle-orm'
import db from '../../db/connection'
import { courses, courseFiles, flashcards, mcqs, mcqAttempts, flashcardSessions } from '../../db/schema'
import type { NewCourse, NewCourseFile, NewFlashcard, NewMcq, NewMcqAttempt, NewFlashcardSession,  } from '../../db/schema/notes.schema'
 
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

export const updateCourse = async (courseId: string, userId: string, data: { name: string }) => {
    const [updated] = await db
        .update(courses)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(courses.id, courseId), eq(courses.userId, userId)))
        .returning()
    return updated ?? null
}
// Gets counts of files, flashcards, and MCQs for each course of a user.
// Returns 3 maps: { courseId -> filesCount }, { courseId -> flashcardsCount }, { courseId -> mcqsCount }.
export const getCourseCounts = async (userId: string) => {
    const rows = await db
        .select({
            courseId:       courses.id,
            filesCount:     sql<number>`count(distinct ${courseFiles.id})::int`, // count distinct file IDs to avoid double-counting when joining with flashcards and MCQs
            flashcardsCount: sql<number>`count(distinct ${flashcards.id})::int`,
            mcqsCount:      sql<number>`count(distinct ${mcqs.id})::int`,
        })
        .from(courses)
        .leftJoin(courseFiles, eq(courseFiles.courseId, courses.id)) // left join so courses with no files are included with count 0
        .leftJoin(flashcards,  eq(flashcards.courseId,  courses.id))
        .leftJoin(mcqs,        eq(mcqs.courseId,        courses.id))
        .where(eq(courses.userId, userId))
        .groupBy(courses.id)

    const fileMap      = Object.fromEntries(rows.map(r => [r.courseId, r.filesCount]))
    const flashcardMap = Object.fromEntries(rows.map(r => [r.courseId, r.flashcardsCount]))
    const mcqMap       = Object.fromEntries(rows.map(r => [r.courseId, r.mcqsCount]))

    return { fileMap, flashcardMap, mcqMap }
}

// ---- Course Files ---------------------------------------------------------

export const getFilesByCourse = async (courseId: string, userId: string) => {
    return db
        .select()
        .from(courseFiles)
        .where(and(eq(courseFiles.courseId, courseId), eq(courseFiles.userId, userId)))
}

export const getFileByCourse = async (fileId: string, courseId: string, userId: string) => {
    return db
        .select()
        .from(courseFiles)
        .where(
            and(
                eq(courseFiles.id, fileId),
                eq(courseFiles.courseId, courseId),
                eq(courseFiles.userId, userId)
            )
        )
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
        .orderBy(asc(flashcards.createdAt)) // order by creation time (oldest first)
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

// Replaces content of an existing flashcard row in-place (for regenerate).
export const replaceFlashcardContent = async (
    flashcardId: string,
    userId: string,
    data: { question: string; answer: string }
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

// ---- Flashcard Sessions ---------------------------------------------------
// Creates a new session row when user starts studying.
export const insertFlashcardSession = async (payload: Omit<NewFlashcardSession, 'expiresAt'>) => {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)
    const [created] = await db
        .insert(flashcardSessions)
        .values({ ...payload, expiresAt })
        .returning()
    return created
}
 
// Called when user finishes all cards — writes the final counts and completedAt.
export const completeFlashcardSession = async (
    sessionId: string,
    userId:    string,
    counts:    { familiarCount: number; unfamiliarCount: number; totalCards: number }
) => {
    const [updated] = await db
        .update(flashcardSessions)
        .set({ ...counts, completedAt: new Date() })
        .where(and(eq(flashcardSessions.id, sessionId), eq(flashcardSessions.userId, userId)))
        .returning()
    return updated
}

// Deletes sessions older than 30 days
export const deleteExpiredSessions = async () => {
    await db
        .delete(flashcardSessions)
        .where(lt(flashcardSessions.expiresAt, new Date()))
}

// For progress tab — gets all completed sessions for a course.
// Used to compute: overall familiarity %, last studied date, sessions completed count.
export const getSessionsByCourse = async (courseId: string, userId: string) => {
    return db
        .select()
        .from(flashcardSessions)
        .where(
            and(
                eq(flashcardSessions.courseId, courseId),
                eq(flashcardSessions.userId, userId),
            )
        )
        .orderBy(flashcardSessions.startedAt)
}

// ---- MCQs -----------------------------------------------------------------

export const getMcqsByCourse = async (courseId: string, userId: string) => {
    return db
        .select()
        .from(mcqs)
        .where(and(eq(mcqs.courseId, courseId), eq(mcqs.userId, userId)))
        .orderBy(asc(mcqs.createdAt)) // order by creation time (oldest first) 
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

export const replaceMcqContent = async (
    mcqId: string,
    userId: string,
    data: { question: string; options: string; correctOption: number; explanation: string | null; difficulty: 'easy' | 'medium' | 'hard' }
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