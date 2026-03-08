import { pgTable, uuid, varchar, integer, timestamp, pgEnum, jsonb } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import users from './user.schema'

// Reuse priority enum from event.schema — import it
import { priorityEnum } from './event.schema'

/**
 * study_plans — one row per "overall study plan session" a user generates.
 * Each plan can have multiple courses stored as JSONB (CourseEntry[]).
 *
 * CourseEntry shape:
 * {
 *   course: string
 *   preparation: number        // 0–100 %
 *   priority: 'low'|'medium'|'high'
 *   color: string              // hex color assigned to this course for the chart
 *   weeklyPlan: { day: string; hours: number }[]
 * }
 */
export const studyPlans = pgTable('study_plans', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
        .references(() => users.id, { onDelete: 'cascade' })
        .notNull(),
    name: varchar('name', { length: 100 }).default('My Study Plan'),
    courses: jsonb('courses').notNull().default('[]'),   // CourseEntry[]
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type StudyPlan = typeof studyPlans.$inferSelect
export type NewStudyPlan = typeof studyPlans.$inferInsert

export const insertStudyPlanSchema = createInsertSchema(studyPlans)
export const selectStudyPlanSchema = createSelectSchema(studyPlans)

export default studyPlans