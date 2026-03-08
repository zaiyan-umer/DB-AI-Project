import { api } from '../lib/axios'

// ---- Types ----------------------------------------------------------------

export type EventType = 'assignment' | 'quiz' | 'mid' | 'final' | 'project' | 'study'
export type Priority = 'low' | 'medium' | 'high'

export interface CourseEntry {
  course: string
  preparation: number
  priority: Priority
  color: string
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
  event?: { title: string; date: string }
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