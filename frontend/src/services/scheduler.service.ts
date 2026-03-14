import { api } from '../lib/axios'

// ---- Types ----------------------------------------------------------------

export type EventType = 'assignment' | 'quiz' | 'mid' | 'final' | 'project' | 'study'
export type Priority = 'low' | 'medium' | 'high'
export type StudyStatus = 'complete' | 'missed' | 'less_than' | 'greater_than'
export type DayStatus = StudyStatus | null

export interface CourseEntry {
  course: string
  preparation: number
  priority: Priority
  color: string
  confirmed?: boolean
  weeklyPlan: { day: string; hours: number }[]
}

export interface Event {
  id: string
  userId: string
  title: string
  course: string
  type: EventType
  priority: Priority
  date: string
  time?: string
  createdAt: string
}

export interface StudyPlan {
  id: string
  userId: string
  name: string
  courses: CourseEntry[]
  createdAt: string
  updatedAt: string
}

export interface Notification {
  id: string
  userId: string
  eventId?: string
  message: string
  isRead: boolean
  createdAt: string
  event?: { title: string; date: string; course: string } | null
}

export interface StudyPlanLog {
  id: string
  userId: string
  studyPlanId: string
  course: string
  weekStart: string                // "YYYY-MM-DD"
  scheduledHours: number[]         // [mon, tue, wed, thu, fri, sat, sun]
  dayStatuses: DayStatus[]         // [mon, tue, wed, thu, fri, sat, sun]
  createdAt: string
  updatedAt: string
}

// ---- Events ---------------------------------------------------------------

export const fetchEvents = async (): Promise<Event[]> => {
  const res = await api.get('/scheduler/events')
  return res.data
}

export const createEvent = async (payload: Omit<Event, 'id' | 'userId' | 'createdAt'>): Promise<Event> => {
  const res = await api.post('/scheduler/events', payload)
  return res.data
}

export const deleteEvent = async (id: string): Promise<void> => {
  await api.delete(`/scheduler/events/${id}`)
}

// ---- Study Plans ----------------------------------------------------------

export const fetchStudyPlan = async (): Promise<StudyPlan | null> => {
  const res = await api.get('/scheduler/study-plan')
  return res.data
}

export const saveStudyPlan = async (payload: { name?: string; courses: CourseEntry[] }): Promise<StudyPlan> => {
  const res = await api.post('/scheduler/study-plan', payload)
  return res.data
}

// ---- Notifications --------------------------------------------------------

export const fetchNotifications = async (): Promise<Notification[]> => {
  const res = await api.get('/scheduler/notifications')
  return res.data
}

export const markNotificationRead = async (id: string): Promise<void> => {
  await api.patch(`/scheduler/notifications/${id}/read`)
}

export const deleteNotification = async (id: string): Promise<void> => {
  await api.delete(`/scheduler/notifications/${id}`)
}

export const deleteAllNotifications = async (): Promise<void> => {
  await api.delete('/scheduler/notifications')
}

// ---- Study Plan Logs ------------------------------------------------------

export const fetchPlanLogs = async (): Promise<StudyPlanLog[]> => {
  const res = await api.get('/scheduler/plan-logs')
  return res.data
}

/**
 * Save weekly log for one course.
 * dayStatuses: 7-element array (Mon–Sun), null = not set yet.
 */
export const savePlanLogs = async (payload: {
  studyPlanId: string
  course: string
  scheduledHours: number[]
  dayStatuses: DayStatus[]
}): Promise<StudyPlanLog> => {
  const res = await api.post('/scheduler/plan-logs', payload)
  return res.data
}

/**
 * Delete all logs + study plan entry for a course.
 */
export const deleteCourseData = async (payload: {
  studyPlanId: string
  course: string
}): Promise<void> => {
  await api.delete('/scheduler/plan-logs/delete-course', { data: payload })
}