import { pgTable, uuid, varchar, timestamp, jsonb, } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import users from './user.schema'
import studyPlans from './study_plan.schema'

/**
 * study_plan_logs — ONE row per (user, course, weekStart).
 *
 * dayStatuses is a JSONB array of 7 elements (Mon–Sun), each either:
 *   null           — not yet marked
 *   'complete'     — studied the full scheduled amount
 *   'missed'       — did not study
 *   'less_than'    — studied less than scheduled
 *   'greater_than' — studied more than scheduled
 *
 * scheduledHours is a JSONB array of 7 numbers matching the weeklyPlan hours.
 *
 * weekStart is the ISO date string of Monday of that week (e.g. "2025-03-10").
 * Used for week expiry logic — UI hides rows older than 7 days,
 * backend cron deletes rows older than 31 days.
 */
export const studyPlanLogs = pgTable('study_plan_logs', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
        .references(() => users.id, { onDelete: 'cascade' })
        .notNull(),
    studyPlanId: uuid('study_plan_id')
        .references(() => studyPlans.id, { onDelete: 'cascade' })
        .notNull(),
    course: varchar('course', { length: 100 }).notNull(),
    weekStart: varchar('week_start', { length: 10 }).notNull(), // "YYYY-MM-DD" of Monday
    // Array of 7 scheduled hours, index 0=Mon … 6=Sun
    scheduledHours: jsonb('scheduled_hours').notNull().default('[]'),
    // Array of 7 statuses, index 0=Mon … 6=Sun, null = not yet set
    dayStatuses: jsonb('day_statuses').notNull().default('[null,null,null,null,null,null,null]'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type StudyPlanLog = typeof studyPlanLogs.$inferSelect
export type NewStudyPlanLog = typeof studyPlanLogs.$inferInsert

// Type for the dayStatuses array elements
export type DayStatus = 'complete' | 'missed' | 'less_than' | 'greater_than' | null

export const insertStudyPlanLogSchema = createInsertSchema(studyPlanLogs)
export const selectStudyPlanLogSchema = createSelectSchema(studyPlanLogs)

export default studyPlanLogs