import type { Request, Response } from 'express'
import path from 'path'
import fs from 'fs'
import {
    getCoursesByUser,
    getCourseById,
    insertCourse,
    removeCourse,
    getCourseCounts,
    getFilesByCourse,
    getFileById,
    insertFile,
    removeFile,
    getFlashcardsByCourse,
    insertFlashcard,
    getMcqsByCourse,
    getMcqById,
    insertMcq,
    insertMcqAttempt,
} from '../services/dal/notes.dal'

// ---- Helpers --------------------------------------------------------------

const COURSE_COLORS = [
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-orange-500 to-red-500',
    'from-green-500 to-emerald-500',
    'from-indigo-500 to-purple-500',
    'from-yellow-500 to-orange-500',
    'from-teal-500 to-cyan-500',
    'from-rose-500 to-pink-500',
]

const pickColor = (index: number) => COURSE_COLORS[index % COURSE_COLORS.length]

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

// ---- Courses --------------------------------------------------------------

export const getCourses = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id
        const userCourses = await getCoursesByUser(userId)

        const coursesWithCounts = await Promise.all(
            userCourses.map(async (course) => {
                const counts = await getCourseCounts(course.id)
                return { ...course, ...counts }
            })
        )

        return res.status(200).json(coursesWithCounts)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to fetch courses' })
    }
}

export const createCourse = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id
        const { name, color } = req.body

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Course name is required' })
        }

        const existingCourses = await getCoursesByUser(userId)
        const assignedColor = color ?? pickColor(existingCourses.length)

        const course = await insertCourse({
            userId,
            name: name.trim(),
            color: assignedColor,
        })

        return res.status(201).json({ ...course, filesCount: 0, flashcardsCount: 0, mcqsCount: 0 })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to create course' })
    }
}

export const deleteCourse = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id
        const courseId = req.params.courseId as string

        const deleted = await removeCourse(courseId, userId)
        if (!deleted) return res.status(404).json({ message: 'Course not found' })

        return res.status(200).json({ message: 'Course deleted' })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to delete course' })
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
// Cards are fetched and displayed in flip mode. AI generates them in iter 3.

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

// Placeholder endpoint — will be replaced by AI generation in iteration 3.
// For now seeds a dummy card so the UI is not empty during development.
export const seedFlashcards = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id
        const courseId = req.params.courseId as string

        const course = await getCourseById(courseId, userId)
        if (!course) return res.status(404).json({ message: 'Course not found' })

        const { cards } = req.body   // [{ question, answer }]
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

// ---- MCQs -----------------------------------------------------------------
// MCQs are fetched and used in the test. AI generates them in iteration 3.

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

// Placeholder endpoint — will be replaced by AI generation in iteration 3.
export const seedMcqs = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id
        const courseId = req.params.courseId as string

        const course = await getCourseById(courseId, userId)
        if (!course) return res.status(404).json({ message: 'Course not found' })

        const { questions } = req.body  // [{ question, options, correctOption, explanation?, difficulty? }]
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