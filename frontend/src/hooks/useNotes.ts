import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
    fetchCourses,
    createCourse,
    deleteCourse,
    fetchFiles,
    uploadFile,
    deleteFile,
    fetchFlashcards,
    fetchMcqs,
    submitMcqAttempt,
} from '../services/notes.service'

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
        mutationFn: createCourse,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['courses'] })
            toast.success('Course created!')
        },
        onError: () => toast.error('Failed to create course'),
    })
}

export const useDeleteCourse = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: deleteCourse,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['courses'] })
            toast.success('Course deleted')
        },
        onError: () => toast.error('Failed to delete course'),
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
        mutationFn: deleteFile,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['files', courseId] })
            qc.invalidateQueries({ queryKey: ['courses'] })
            toast.success('File deleted')
        },
        onError: () => toast.error('Failed to delete file'),
    })
}

// ---- Flashcards -----------------------------------------------------------
// Read-only from the UI perspective. AI seeds them in iteration 3.

export const useFlashcards = (courseId: string) =>
    useQuery({
        queryKey: ['flashcards', courseId],
        queryFn:  () => fetchFlashcards(courseId),
        enabled:  !!courseId,
        staleTime: 2 * 60 * 1000,
    })

// ---- MCQs -----------------------------------------------------------------
// Read-only from the UI perspective. AI seeds them in iteration 3.

export const useMcqs = (courseId: string) =>
    useQuery({
        queryKey: ['mcqs', courseId],
        queryFn:  () => fetchMcqs(courseId),
        enabled:  !!courseId,
        staleTime: 2 * 60 * 1000,
    })

export const useSubmitMcqAttempt = (courseId: string) =>
    useMutation({
        mutationFn: ({ mcqId, selectedOption }: { mcqId: string; selectedOption: number }) =>
            submitMcqAttempt(courseId, mcqId, selectedOption),
        onError: () => toast.error('Failed to submit attempt'),
    })