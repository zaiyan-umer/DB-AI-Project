import { and, eq, gte, lte } from 'drizzle-orm'
import db from '../../db/connection'
import { events, notifications, studyPlans } from '../../db/schema'
import type { NewEvent } from '../../db/schema/event.schema'

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

/**
 * Find events whose date is tomorrow — used by the notification cron job.
 */
export const getEventsDueTomorrow = async () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const start = new Date(tomorrow.setHours(0, 0, 0, 0))
    const end = new Date(tomorrow.setHours(23, 59, 59, 999))

    return db
        .select()
        .from(events)
        .where(and(gte(events.date, start), lte(events.date, end)))
}

// ---- Study Plans ----------------------------------------------------------

export const getStudyPlanByUser = async (userId: string) => {
    const [plan] = await db
        .select()
        .from(studyPlans)
        .where(eq(studyPlans.userId, userId))
    return plan ?? null
}

export const upsertStudyPlan = async (
    userId: string,
    payload: { name?: string; courses: object }
) => {
    const existing = await getStudyPlanByUser(userId)

    if (existing) {
        const [updated] = await db
            .update(studyPlans)
            .set({ courses: payload.courses, name: payload.name, updatedAt: new Date() })
            .where(eq(studyPlans.userId, userId))
            .returning()
        return updated
    }

    const [created] = await db
        .insert(studyPlans)
        .values({ userId, ...payload })
        .returning()
    return created
}

// ---- Notifications --------------------------------------------------------

export const getNotificationsByUser = async (userId: string) => {
    return db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
}

export const insertNotification = async (
    userId: string,
    message: string,
    eventId?: string
) => {
    const [created] = await db
        .insert(notifications)
        .values({ userId, message, eventId })
        .returning()
    return created
}

/**
 * Returns true if a notification for this event was already inserted today.
 * Prevents the cron job from creating duplicates if it runs more than once.
 */
export const notificationExistsForEventToday = async (eventId: string): Promise<boolean> => {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const results = await db
        .select()
        .from(notifications)
        .where(
            and(
                eq(notifications.eventId, eventId),
                gte(notifications.createdAt, startOfDay)
            )
        )

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
    await db
        .delete(notifications)
        .where(eq(notifications.userId, userId))
}