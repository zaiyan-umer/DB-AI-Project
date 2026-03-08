import { api } from '../lib/axios'

// ---- Types ----------------------------------------------------------------

export interface Course {
    id:              string
    userId:          string
    name:            string
    color:           string
    filesCount:      number
    flashcardsCount: number
    mcqsCount:       number
    createdAt:       string
    updatedAt:       string
}

export interface CourseFile {
    id:           string
    courseId:     string
    userId:       string
    originalName: string
    storagePath:  string
    mimeType:     string
    sizeBytes:    number
    aiProcessed:  boolean
    createdAt:    string
}

export interface Flashcard {
    id:          string
    courseId:    string
    userId:      string
    question:    string
    answer:      string
    aiGenerated: boolean
    createdAt:   string
    updatedAt:   string
}

export type McqDifficulty = 'easy' | 'medium' | 'hard'

export interface Mcq {
    id:            string
    courseId:      string
    userId:        string
    question:      string
    options:       string[]
    correctOption: number
    explanation:   string | null
    difficulty:    McqDifficulty
    aiGenerated:   boolean
    createdAt:     string
    updatedAt:     string
}

export interface McqAttemptResult {
    id:             string
    mcqId:          string
    userId:         string
    selectedOption: number
    isCorrect:      boolean
    correctOption:  number
    attemptedAt:    string
}

// ---- Courses --------------------------------------------------------------

export const fetchCourses = async (): Promise<Course[]> => {
    const res = await api.get('/notes')
    return res.data
}

export const createCourse = async (payload: { name: string; color?: string }): Promise<Course> => {
    const res = await api.post('/notes', payload)
    return res.data
}

export const deleteCourse = async (courseId: string): Promise<void> => {
    await api.delete(`/notes/${courseId}`)
}

// ---- Files ----------------------------------------------------------------

export const fetchFiles = async (courseId: string): Promise<CourseFile[]> => {
    const res = await api.get(`/notes/${courseId}/files`)
    return res.data
}

export const uploadFile = async (courseId: string, file: File): Promise<CourseFile> => {
    const form = new FormData()
    form.append('file', file)
    
    const res = await api.post(`/notes/${courseId}/files`, form, {
        headers: { 'Content-Type': undefined },
    })
    return res.data
}

export const deleteFile = async (fileId: string): Promise<void> => {
    await api.delete(`/notes/files/${fileId}`)
}

export const getDownloadUrl = (fileId: string): string =>
    `http://localhost:8000/api/notes/files/${fileId}/download`

// ---- Flashcards -----------------------------------------------------------

export const fetchFlashcards = async (courseId: string): Promise<Flashcard[]> => {
    const res = await api.get(`/notes/${courseId}/flashcards`)
    return res.data
}

// ---- MCQs -----------------------------------------------------------------

export const fetchMcqs = async (courseId: string): Promise<Mcq[]> => {
    const res = await api.get(`/notes/${courseId}/mcqs`)
    return res.data
}

export const submitMcqAttempt = async (
    courseId:       string,
    mcqId:          string,
    selectedOption: number
): Promise<McqAttemptResult> => {
    const res = await api.post(`/notes/${courseId}/mcqs/${mcqId}/attempt`, { selectedOption })
    return res.data
}