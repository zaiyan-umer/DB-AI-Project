import { pgTable, uuid, smallint, numeric, timestamp, pgEnum, unique } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import users from './user.schema'
import { studyPlanCourses } from './study_plan.schema'

// ---- day status enum ------------------------------------------------------
// Extracted from the old DayStatus union type into a proper DB enum.

export const dayStatusEnum = pgEnum('day_status', [
    'complete',
    'missed',
    'less_than',
    'greater_than',
])

// ---- study_plan_log_days --------------------------------------------------
// One row per (user, study_plan_course, week_start, day_of_week).
// FK: study_plan_course_id → study_plan_courses.id (cascade delete)
//     Deleting a course now cascade-deletes all its log rows automatically,
//     eliminating the hand-rolled deleteLogsByCourse DAL function.
// FK: user_id → users.id (cascade delete)

export const studyPlanLogDays = pgTable('study_plan_log_days', {
    id:                uuid('id').primaryKey().defaultRandom(),
    userId:            uuid('user_id')
                           .references(() => users.id, { onDelete: 'cascade' })
                           .notNull(),
    studyPlanCourseId: uuid('study_plan_course_id')
                           .references(() => studyPlanCourses.id, { onDelete: 'cascade' })
                           .notNull(),
    weekStart:         timestamp('week_start').notNull(),          // Monday 00:00:00 UTC of that week
    dayOfWeek:         smallint('day_of_week').notNull(),          // 0=Mon … 6=Sun
    scheduledHours:    numeric('scheduled_hours', { precision: 4, scale: 1 }).notNull(),
    status:            dayStatusEnum('status'),                    // null = not yet marked
    createdAt:         timestamp('created_at').notNull().defaultNow(),
    updatedAt:         timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
    unique().on(t.studyPlanCourseId, t.weekStart, t.dayOfWeek),
])

export type StudyPlanLogDay    = typeof studyPlanLogDays.$inferSelect
export type NewStudyPlanLogDay = typeof studyPlanLogDays.$inferInsert

// Re-export DayStatus as a TS type for use in DAL / controller
export type DayStatus = 'complete' | 'missed' | 'less_than' | 'greater_than' | null

export const insertStudyPlanLogDaySchema = createInsertSchema(studyPlanLogDays)
export const selectStudyPlanLogDaySchema = createSelectSchema(studyPlanLogDays)

export default studyPlanLogDays