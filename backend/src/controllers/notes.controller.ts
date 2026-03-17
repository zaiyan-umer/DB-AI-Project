import type { Request, Response } from 'express'
import path from 'path'
import fs from 'fs'
import { getCoursesByUser, getCourseById, insertCourse, removeCourse, updateCourse, getCourseCounts, getFilesByCourse, getFileById, insertFile, removeFile, getFlashcardsByCourse, insertFlashcard, replaceFlashcardContent, insertFlashcardSession, completeFlashcardSession, getMcqsByCourse, getMcqById, insertMcq, replaceMcqContent, insertMcqAttempt,} from '../services/dal/notes.dal'

// ---- Helpers --------------------------------------------------------------

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

// ---- Courses --------------------------------------------------------------

export const getCourses = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id
        const userCourses = await getCoursesByUser(userId)

        // 3 queries total: 1 to get file counts, 1 to get flashcard counts, 1 to get mcq counts 
        const { fileMap, flashcardMap, mcqMap } = await getCourseCounts(userId)

        const coursesWithCounts = userCourses.map((course) => ({
            ...course,
            filesCount:      fileMap[course.id]      ?? 0, // if no files for this course, default to 0
            flashcardsCount: flashcardMap[course.id] ?? 0,
            mcqsCount:       mcqMap[course.id]       ?? 0,
        }))

        return res.status(200).json(coursesWithCounts)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to fetch courses' })
    }
}

export const createCourse = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id
        const { name } = req.body

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Course name is required' })
        }

        const course = await insertCourse({
            userId,
            name: name.trim(),
        })

        return res.status(201).json({ ...course, filesCount: 0, flashcardsCount: 0, mcqsCount: 0 })
    } catch (err: any) {
        if (err?.cause?.code === '23505') {
            return res.status(409).json({ message: 'You already have a course with this name' })
        }
        console.error(err)
        return res.status(500).json({ message: 'Failed to create course' })
    }
}

export const deleteCourse = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id
        const courseId = req.params.courseId as string

        // ── Delete physical files from disk before removing DB row ──
        const files = await getFilesByCourse(courseId, userId)
        for (const file of files) {
            const fullPath = path.join(process.cwd(), file.storagePath)
            if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath)
        }

        const deleted = await removeCourse(courseId, userId)
        if (!deleted) return res.status(404).json({ message: 'Course not found' })

        return res.status(200).json({ message: 'Course deleted' })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to delete course' })
    }
}

export const renameCourse = async (req: Request, res: Response) => {
    try {
        const userId   = req.user!.id
        const courseId = req.params.courseId as string
        const { name } = req.body

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Course name is required' })
        }

        const updated = await updateCourse(courseId, userId, { name: name.trim() })
        if (!updated) return res.status(404).json({ message: 'Course not found' })

        return res.status(200).json(updated)
    } catch (err: any) {
        if (err?.cause?.code === '23505') {
            return res.status(409).json({ message: 'You already have a course with this name' })
        }
        console.error(err)
        return res.status(500).json({ message: 'Failed to rename course' })
    }
}

// ---- Files ----------------------------------------------------------------

export const getFiles = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id
        const courseId = req.params.courseId as string

        const course = await getCourseById(courseId, userId)
        if (!course) return res.status(404).json({ message: 'Course not found' })

        const files = await getFilesByCourse(courseId, userId)
        return res.status(200).json(files)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to fetch files' })
    }
}

export const uploadFile = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id
        const courseId = req.params.courseId as string

        const course = await getCourseById(courseId, userId)
        if (!course) return res.status(404).json({ message: 'Course not found' })

        const multerFile = (req as any).file
        if (!multerFile) return res.status(400).json({ message: 'No file uploaded' })

        const file = await insertFile({
            courseId,
            userId,
            originalName: multerFile.originalname,
            storagePath:  `/uploads/${multerFile.filename}`,
            mimeType:     multerFile.mimetype,
            sizeBytes:    multerFile.size,
        })

        return res.status(201).json(file)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to upload file' })
    }
}

export const downloadFile = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id
        const fileId = req.params.fileId as string

        const file = await getFileById(fileId, userId)
        if (!file) return res.status(404).json({ message: 'File not found' })

        const fullPath = path.join(process.cwd(), file.storagePath)
        if (!fs.existsSync(fullPath)) return res.status(404).json({ message: 'File missing from storage' })

        return res.download(fullPath, file.originalName)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to download file' })
    }
}

export const deleteFile = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id
        const fileId = req.params.fileId as string

        const file = await getFileById(fileId, userId)
        if (!file) return res.status(404).json({ message: 'File not found' })

        const fullPath = path.join(process.cwd(), file.storagePath)
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath)

        await removeFile(fileId, userId)
        return res.status(200).json({ message: 'File deleted' })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to delete file' })
    }
}

// ---- Flashcards -----------------------------------------------------------
// Cards are fetched and displayed in flip mode. 

export const getFlashcards = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id
        const courseId = req.params.courseId as string

        const course = await getCourseById(courseId, userId)
        if (!course) return res.status(404).json({ message: 'Course not found' })

        const cards = await getFlashcardsByCourse(courseId, userId)
        return res.status(200).json(cards)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to fetch flashcards' })
    }
}

// Placeholder endpoint — will be replaced by AI generation later.
export const seedFlashcards = async (req: Request, res: Response) => {
    try {
        const userId   = req.user!.id
        const courseId = req.params.courseId as string

        const course = await getCourseById(courseId, userId)
        if (!course) return res.status(404).json({ message: 'Course not found' })

        const { cards } = req.body
        if (!Array.isArray(cards) || cards.length === 0) {
            return res.status(400).json({ message: 'cards array is required' })
        }

        const inserted = await Promise.all(
            cards.map((c: { question: string; answer: string }) =>
                insertFlashcard({ courseId, userId, question: c.question, answer: c.answer, aiGenerated: false })
            )
        )

        return res.status(201).json(inserted)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to seed flashcards' })
    }
}

// Regenerate — replaces content of existing cards in-place.
export const regenerateFlashcards = async (req: Request, res: Response) => {
    try {
        const userId   = req.user!.id
        const courseId = req.params.courseId as string

        const course = await getCourseById(courseId, userId)
        if (!course) return res.status(404).json({ message: 'Course not found' })

        const existing    = await getFlashcardsByCourse(courseId, userId)
        const { cards }   = req.body

        if (!Array.isArray(cards) || cards.length !== existing.length) {
            return res.status(400).json({ message: `Expected ${existing.length} cards, got ${cards?.length ?? 0}` })
        }
        
        const updated = await Promise.all(
            existing.map((card, i) =>
                replaceFlashcardContent(card.id, userId, {
                    question: cards[i].question,
                    answer:   cards[i].answer,
                })
            )
        )

        return res.status(200).json(updated)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to regenerate flashcards' })
    }
}

// ---- Flashcard Sessions ---------------------------------------------------
// Called when user opens the flashcards tab and starts a new session.
export const startFlashcardSession = async (req: Request, res: Response) => {
    try {
        const userId   = req.user!.id
        const courseId = req.params.courseId as string

        const course = await getCourseById(courseId, userId)
        if (!course) return res.status(404).json({ message: 'Course not found' })

        const session = await insertFlashcardSession({ userId, courseId })
        return res.status(201).json(session)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to start session' })
    }
}

// Called when user finishes all cards — finalises the session with counts.
export const finishFlashcardSession = async (req: Request, res: Response) => {
    try {
        const userId    = req.user!.id
        const sessionId = req.params.sessionId as string
        const { familiarCount, unfamiliarCount, totalCards } = req.body

        if (typeof familiarCount !== 'number' || typeof unfamiliarCount !== 'number' || typeof totalCards !== 'number') {
            return res.status(400).json({ message: 'familiarCount, unfamiliarCount, totalCards are required' })
        }

        const session = await completeFlashcardSession(sessionId, userId, { familiarCount, unfamiliarCount, totalCards })
        if (!session) return res.status(404).json({ message: 'Session not found' })

        return res.status(200).json(session)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to complete session' })
    }
}

// ---- MCQs -----------------------------------------------------------------
// MCQs are fetched and used in the test.

export const getMcqs = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id
        const courseId = req.params.courseId as string

        const course = await getCourseById(courseId, userId)
        if (!course) return res.status(404).json({ message: 'Course not found' })

        const questions = await getMcqsByCourse(courseId, userId)
        const parsed = questions.map((q) => ({ ...q, options: JSON.parse(q.options) }))

        return res.status(200).json(parsed)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to fetch MCQs' })
    }
}

// Placeholder endpoint — will be replaced by AI generation later.
export const seedMcqs = async (req: Request, res: Response) => {
    try {
        const userId   = req.user!.id
        const courseId = req.params.courseId as string

        const course = await getCourseById(courseId, userId)
        if (!course) return res.status(404).json({ message: 'Course not found' })

        const { questions } = req.body
        if (!Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ message: 'questions array is required' })
        }

        const inserted = await Promise.all(
            questions.map((q: {
                question:      string
                options:       string[]
                correctOption: number
                explanation?:  string
                difficulty?:   'easy' | 'medium' | 'hard'
            }) =>
                insertMcq({
                    courseId,
                    userId,
                    question:      q.question,
                    options:       JSON.stringify(q.options),
                    correctOption: q.correctOption,
                    explanation:   q.explanation ?? null,
                    difficulty:    q.difficulty ?? 'medium',
                    aiGenerated:   false,
                })
            )
        )

        const parsed = inserted.map((m) => ({ ...m, options: JSON.parse(m.options) }))
        return res.status(201).json(parsed)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to seed MCQs' })
    }
}

// Regenerate — replaces content of existing MCQ rows in-place.
export const regenerateMcqs = async (req: Request, res: Response) => {
    try {
        const userId   = req.user!.id
        const courseId = req.params.courseId as string

        const course = await getCourseById(courseId, userId)
        if (!course) return res.status(404).json({ message: 'Course not found' })

        const existing      = await getMcqsByCourse(courseId, userId)
        const { questions } = req.body

        if (!Array.isArray(questions) || questions.length !== existing.length) {
            return res.status(400).json({ message: `Expected ${existing.length} questions, got ${questions?.length ?? 0}` })
        }

        const updated = await Promise.all(
            existing.map((mcq, i) =>
                replaceMcqContent(mcq.id, userId, {
                    question:      questions[i].question,
                    options:       JSON.stringify(questions[i].options),
                    correctOption: questions[i].correctOption,
                    explanation:   questions[i].explanation ?? null,
                    difficulty:    questions[i].difficulty ?? 'medium',
                })
            )
        )

        const parsed = updated.map((m) => ({ ...m, options: JSON.parse(m.options) }))
        return res.status(200).json(parsed)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to regenerate MCQs' })
    }
}

export const submitMcqAttempt = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id
        const mcqId = req.params.mcqId as string
        const { selectedOption } = req.body

        if (typeof selectedOption !== 'number') {
            return res.status(400).json({ message: 'selectedOption is required' })
        }

        const mcq = await getMcqById(mcqId, userId)
        if (!mcq) return res.status(404).json({ message: 'MCQ not found' })

        const isCorrect = selectedOption === mcq.correctOption
        const attempt   = await insertMcqAttempt({ mcqId, userId, selectedOption, isCorrect })

        return res.status(201).json({ ...attempt, isCorrect, correctOption: mcq.correctOption })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to submit attempt' })
    }
}