import { and, eq, gte, lte, lt } from 'drizzle-orm'
import db from '../../db/connection'
import { events, notifications, studyPlans, studyPlanLogs } from '../../db/schema'
import type { NewEvent } from '../../db/schema/event.schema'
import type { DayStatus } from '../../db/schema/study_plan_log.schema'

// ---- Events ---------------------------------------------------------------
 
export const getEventsByUser = async (userId: string) => {
    return db.select().from(events).where(eq(events.userId, userId))
}
 
export const insertEvent = async (payload: NewEvent) => {
    const [created] = await db.insert(events).values(payload).returning()
    return created
}
 
export const removeEvent = async (eventId: string, userId: string) => {
    const [deleted] = await db
        .delete(events)
        .where(and(eq(events.id, eventId), eq(events.userId, userId)))
        .returning()
    return deleted
}
 
export const getEventsDueTomorrow = async () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const start = new Date(tomorrow.setHours(0, 0, 0, 0))
    const end = new Date(tomorrow.setHours(23, 59, 59, 999))
    return db.select().from(events).where(and(gte(events.date, start), lte(events.date, end)))
}
 
// ---- Study Plans ----------------------------------------------------------
 
export const getStudyPlanByUser = async (userId: string) => {
    const [plan] = await db.select().from(studyPlans).where(eq(studyPlans.userId, userId))
    return plan ?? null
}
 
export const upsertStudyPlan = async (userId: string, payload: { name?: string; courses: object }) => {
    const existing = await getStudyPlanByUser(userId)
    if (existing) {
        const [updated] = await db
            .update(studyPlans)
            .set({ courses: payload.courses, name: payload.name, updatedAt: new Date() })
            .where(eq(studyPlans.userId, userId))
            .returning()
        return updated
    }
    const [created] = await db.insert(studyPlans).values({ userId, ...payload }).returning()
    return created
}
 
// ---- Notifications (LEFT JOIN with events) --------------------------------
 
export const getNotificationsWithEventDetails = async (userId: string) => {
    const rows = await db
        .select({
            id: notifications.id,
            userId: notifications.userId,
            eventId: notifications.eventId,
            message: notifications.message,
            isRead: notifications.isRead,
            createdAt: notifications.createdAt,
            eventTitle: events.title,
            eventDate: events.date,
            eventCourse: events.course,
        })
        .from(notifications)
        .leftJoin(events, eq(notifications.eventId, events.id))
        .where(eq(notifications.userId, userId))
 
    return rows.map(row => ({
        id: row.id,
        userId: row.userId,
        eventId: row.eventId,
        message: row.message,
        isRead: row.isRead,
        createdAt: row.createdAt,
        event: row.eventTitle
            ? { title: row.eventTitle, date: row.eventDate, course: row.eventCourse }
            : null,
    }))
}
 
export const insertNotification = async (userId: string, message: string, eventId?: string) => {
    const [created] = await db.insert(notifications).values({ userId, message, eventId }).returning()
    return created
}
 
export const notificationExistsForEventToday = async (eventId: string): Promise<boolean> => {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const results = await db.select().from(notifications)
        .where(and(eq(notifications.eventId, eventId), gte(notifications.createdAt, startOfDay)))
    return results.length > 0
}
 
export const markNotificationAsRead = async (notifId: string, userId: string) => {
    const [updated] = await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.id, notifId), eq(notifications.userId, userId)))
        .returning()
    return updated
}
 
export const removeNotification = async (notifId: string, userId: string) => {
    const [deleted] = await db
        .delete(notifications)
        .where(and(eq(notifications.id, notifId), eq(notifications.userId, userId)))
        .returning()
    return deleted
}
 
export const removeAllNotifications = async (userId: string) => {
    await db.delete(notifications).where(eq(notifications.userId, userId))
}
 
// ---- Study Plan Logs ------------------------------------------------------
 
/** Helper: get Monday of the current week as "YYYY-MM-DD" */
export const getCurrentWeekStart = (): string => {
    const now = new Date()
    const day = now.getDay() // 0=Sun
    const diff = day === 0 ? -6 : 1 - day // adjust to Monday
    const monday = new Date(now)
    monday.setDate(now.getDate() + diff)
    return monday.toISOString().split('T')[0]
}
 
export const getLogsByUser = async (userId: string) => {
    return db.select().from(studyPlanLogs).where(eq(studyPlanLogs.userId, userId))
}
 
/**
 * Upsert weekly log — one row per (userId, studyPlanId, course, weekStart).
 * dayStatuses and scheduledHours are full 7-element arrays.
 */
export const upsertWeeklyLog = async (
    userId: string,
    studyPlanId: string,
    course: string,
    weekStart: string,
    scheduledHours: number[],
    dayStatuses: DayStatus[]
) => {
    const [existing] = await db
        .select()
        .from(studyPlanLogs)
        .where(
            and(
                eq(studyPlanLogs.userId, userId),
                eq(studyPlanLogs.studyPlanId, studyPlanId),
                eq(studyPlanLogs.course, course),
                eq(studyPlanLogs.weekStart, weekStart),
            )
        )
 
    if (existing) {
        const [updated] = await db
            .update(studyPlanLogs)
            .set({ dayStatuses, scheduledHours, updatedAt: new Date() })
            .where(eq(studyPlanLogs.id, existing.id))
            .returning()
        return updated
    }
 
    const [created] = await db
        .insert(studyPlanLogs)
        .values({ userId, studyPlanId, course, weekStart, scheduledHours, dayStatuses })
        .returning()
    return created
}
 
/**
 * Delete logs for a specific course (used when user deletes a confirmed course).
 */
export const deleteLogsByCourse = async (userId: string, studyPlanId: string, course: string) => {
    await db
        .delete(studyPlanLogs)
        .where(
            and(
                eq(studyPlanLogs.userId, userId),
                eq(studyPlanLogs.studyPlanId, studyPlanId),
                eq(studyPlanLogs.course, course),
            )
        )
}
 
/**
 * Cron job helper: delete logs older than 31 days.
 */
export const deleteOldLogs = async () => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 31)
    const cutoffStr = cutoff.toISOString().split('T')[0]
    await db.delete(studyPlanLogs).where(lt(studyPlanLogs.weekStart, cutoffStr))
}
 