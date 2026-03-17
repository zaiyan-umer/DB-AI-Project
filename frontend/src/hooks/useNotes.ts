import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fetchCourses, createCourse, deleteCourse, renameCourse, fetchFiles, uploadFile, deleteFile, fetchFlashcards, seedFlashcards, regenerateFlashcards, startFlashcardSession, finishFlashcardSession, fetchMcqs, seedMcqs, regenerateMcqs, submitMcqAttempt, type FlashcardSeedItem, type McqSeedItem,} from '../services/notes.service'

// ---- Courses --------------------------------------------------------------

export const useCourses = () =>
    useQuery({
        queryKey: ['courses'],
        queryFn:  fetchCourses,
        staleTime: 2 * 60 * 1000,
    })

export const useCreateCourse = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (payload: { name: string; color?: string }) => createCourse(payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['courses'] })
            toast.success('Course created!')
        },
        onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to create course'),
    })
}

export const useDeleteCourse = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (courseId: string) => deleteCourse(courseId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['courses'] })
            toast.success('Course deleted')
        },
        onError: () => toast.error('Failed to delete course'),
    })
}

export const useRenameCourse = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ courseId, name }: { courseId: string; name: string }) => renameCourse(courseId, name),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['courses'] })
            toast.success('Course renamed!')
        },
        onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to rename course'),
    })
}

// ---- Files ----------------------------------------------------------------

export const useFiles = (courseId: string) =>
    useQuery({
        queryKey: ['files', courseId],
        queryFn:  () => fetchFiles(courseId),
        enabled:  !!courseId,
        staleTime: 2 * 60 * 1000,
    })

export const useUploadFile = (courseId: string) => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (file: File) => uploadFile(courseId, file),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ['files', courseId] })
            qc.invalidateQueries({ queryKey: ['courses'] })
            toast.success(`${data.originalName} uploaded`)
        },
        onError: () => toast.error('Upload failed'),
    })
}

export const useDeleteFile = (courseId: string) => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (fileId: string) => deleteFile(fileId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['files', courseId] })
            qc.invalidateQueries({ queryKey: ['courses'] })
            toast.success('File deleted')
        },
        onError: () => toast.error('Failed to delete file'),
    })
}

// ---- Flashcards -----------------------------------------------------------
// useSeedFlashcards will call the AI API instead of seeding sample data.

export const useFlashcards = (courseId: string) =>
    useQuery({
        queryKey: ['flashcards', courseId],
        queryFn:  () => fetchFlashcards(courseId),
        enabled:  !!courseId,
        staleTime: 2 * 60 * 1000,
    })

export const useSeedFlashcards = (courseId: string) => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (cards: FlashcardSeedItem[]) => seedFlashcards(courseId, cards),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['flashcards', courseId] })
            qc.invalidateQueries({ queryKey: ['courses'] })
        },
        onError: () => toast.error('Failed to load flashcards'),
    })
}

export const useRegenerateFlashcards = (courseId: string) => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (cards: FlashcardSeedItem[]) => regenerateFlashcards(courseId, cards),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['flashcards', courseId] })
            toast.success('Flashcards regenerated!')
        },
        onError: () => toast.error('Failed to regenerate flashcards'),
    })
}

export const useStartFlashcardSession = (courseId: string) =>
    useMutation({
        mutationFn: () => startFlashcardSession(courseId),
        onError: () => toast.error('Failed to start session'),
    })

export const useFinishFlashcardSession = () =>
    useMutation({
        mutationFn: ({
            sessionId, familiarCount, unfamiliarCount, totalCards,
        }: {
            sessionId: string; familiarCount: number; unfamiliarCount: number; totalCards: number
        }) => finishFlashcardSession(sessionId, familiarCount, unfamiliarCount, totalCards),
        onError: () => toast.error('Failed to save session'),
    })

// ---- MCQs -----------------------------------------------------------------
// useSeedMcqs will call the AI API instead of seeding sample data.

export const useMcqs = (courseId: string) =>
    useQuery({
        queryKey: ['mcqs', courseId],
        queryFn:  () => fetchMcqs(courseId),
        enabled:  !!courseId,
        staleTime: 2 * 60 * 1000,
    })

export const useSeedMcqs = (courseId: string) => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (questions: McqSeedItem[]) => seedMcqs(courseId, questions),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['mcqs', courseId] })
            qc.invalidateQueries({ queryKey: ['courses'] })
        },
        onError: () => toast.error('Failed to load MCQs'),
    })
}

export const useRegenerateMcqs = (courseId: string) => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (questions: McqSeedItem[]) => regenerateMcqs(courseId, questions),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['mcqs', courseId] })
            toast.success('MCQs regenerated!')
        },
        onError: () => toast.error('Failed to regenerate MCQs'),
    })
}

export const useSubmitMcqAttempt = (courseId: string) =>
    useMutation({
        mutationFn: ({ mcqId, selectedOption }: { mcqId: string; selectedOption: number }) =>
            submitMcqAttempt(courseId, mcqId, selectedOption),
        onError: () => toast.error('Failed to submit attempt'),
    })