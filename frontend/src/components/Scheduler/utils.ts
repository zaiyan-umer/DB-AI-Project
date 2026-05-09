import { DAYS } from './constants'
import type { Priority } from '../../services/scheduler.service'

export function generateWeeklyPlan(priority: Priority, preparation: number) {
  const total = priority === 'high' ? 20 : priority === 'medium' ? 15 : 10
  const adjusted = total * (1 - preparation / 100) + 2
  const perDay = adjusted / 7
  return DAYS.map(dayOfWeek => ({
    dayOfWeek,
    hours: Math.max(0.5, Math.round((Math.random() * 0.5 + 0.75) * perDay * 10) / 10),
  }))
}

/** Returns the Monday of the current week as "YYYY-MM-DD" */
export function getCurrentWeekStart(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  return monday.toISOString().split('T')[0]
}
