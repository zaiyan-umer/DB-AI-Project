import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fetchEvents, createEvent, deleteEvent, fetchStudyPlan, saveStudyPlan, fetchNotifications, markNotificationRead, deleteNotification, deleteAllNotifications, fetchPlanLogs, savePlanLogs, deleteCourseData, } from '../services/scheduler.service'

// ---- Events ---------------------------------------------------------------

export const useEvents = () =>
  useQuery({ queryKey: ['events'], queryFn: fetchEvents, staleTime: 2 * 60 * 1000 })

export const useCreateEvent = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createEvent,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); toast.success('Event added!') },
    onError: () => toast.error('Failed to add event'),
  })
}

export const useDeleteEvent = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); toast.success('Event deleted') },
    onError: () => toast.error('Failed to delete event'),
  })
}

// ---- Study Plan -----------------------------------------------------------

export const useStudyPlan = () =>
  useQuery({ queryKey: ['study-plan'], queryFn: fetchStudyPlan, staleTime: 5 * 60 * 1000 })

export const useSaveStudyPlan = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: saveStudyPlan,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['study-plan'] }),
    onError: () => toast.error('Failed to save study plan'),
  })
}

// ---- Notifications --------------------------------------------------------

export const useNotifications = () =>
  useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    staleTime: 20 * 1000,
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: true,
  })

export const useMarkNotificationRead = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export const useDeleteNotification = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export const useDeleteAllNotifications = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteAllNotifications,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); toast.success('All notifications cleared') },
    onError: () => toast.error('Failed to clear notifications'),
  })
}

// ---- Study Plan Logs ------------------------------------------------------

export const usePlanLogs = () =>
  useQuery({ queryKey: ['plan-logs'], queryFn: fetchPlanLogs, staleTime: 5 * 60 * 1000 })

export const useSavePlanLogs = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: savePlanLogs,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['plan-logs'] }); toast.success('Progress saved!') },
    onError: () => toast.error('Failed to save progress'),
  })
}

export const useDeleteCourseData = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteCourseData,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['study-plan'] })
      qc.invalidateQueries({ queryKey: ['plan-logs'] })
      toast.success('Course deleted')
    },
    onError: () => toast.error('Failed to delete course'),
  })
}