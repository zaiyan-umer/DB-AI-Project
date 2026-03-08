import { useState, useMemo } from 'react'
import {Calendar as CalendarIcon, Plus, Clock, Target, Zap, Trash2, Search, SlidersHorizontal, X, ChevronDown,} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Modal } from '../components/Modal'
import { Input } from '../components/Input'
import { useEvents, useCreateEvent, useDeleteEvent, useStudyPlan, useSaveStudyPlan, } from '../hooks/useScheduler'
import type { EventType, Priority, CourseEntry } from '../services/scheduler.service'


// ---- Constants ------------------------------------------------------------

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const COURSE_COLORS = [
  '#667eea', '#f093fb', '#f5576c', '#4facfe', '#43e97b',
  '#fa709a', '#a18cd1', '#fccb90', '#d4fc79', '#30cfd0',
]

const EVENT_TYPE_OPTIONS: EventType[] = ['assignment', 'quiz', 'mid', 'final', 'project', 'study']
const PRIORITY_OPTIONS: Priority[] = ['low', 'medium', 'high']

const eventTypeColors: Record<EventType, string> = {
  assignment: 'bg-blue-100 text-blue-700 border-blue-200',
  quiz: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  mid: 'bg-red-100 text-red-700 border-red-200',
  final: 'bg-purple-100 text-purple-700 border-purple-200',
  project: 'bg-green-100 text-green-700 border-green-200',
  study: 'bg-indigo-100 text-indigo-700 border-indigo-200',
}

const priorityBarColors: Record<Priority, string> = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
}

// ---- Empty form states ----------------------------------------------------

const emptyEvent = {
  title: '',
  type: 'assignment' as EventType,
  date: '',
  time: '',
  course: '',
  priority: 'medium' as Priority,
}

const emptyCourse = {
  course: '',
  preparation: 30,
  priority: 'medium' as Priority,
}

// ---- Helpers --------------------------------------------------------------

function generateWeeklyPlan(priority: Priority, preparation: number): { day: string; hours: number }[] {
  const totalHours = priority === 'high' ? 20 : priority === 'medium' ? 15 : 10
  const adjustedHours = totalHours * (1 - preparation / 100) + 2
  const hoursPerDay = adjustedHours / 7
  return DAYS.map(day => ({
    day,
    hours: Math.max(0.5, Math.round((Math.random() * 0.5 + 0.75) * hoursPerDay * 10) / 10),
  }))
}

// ---- Main Component -------------------------------------------------------

export default function SchedulerPage() {
  const { data: events = [], isLoading: eventsLoading } = useEvents()
  const { data: savedPlan } = useStudyPlan()
  const { mutate: createEvent, isPending: creating } = useCreateEvent()
  const { mutate: deleteEvent } = useDeleteEvent()
  const { mutate: savePlan } = useSaveStudyPlan()

  // ---------- Event Modal ----------
  const [showEventModal, setShowEventModal] = useState(false)
  const [newEvent, setNewEvent] = useState(emptyEvent)

  // ---------- Filters ----------
  const [filterType, setFilterType] = useState<EventType | 'all'>('all')
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all')
  const [filterCourse, setFilterCourse] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // ---------- Study Plan ----------
  const [courseForm, setCourseForm] = useState(emptyCourse)
  const [planCourses, setPlanCourses] = useState<CourseEntry[]>(
    (savedPlan?.courses as CourseEntry[]) ?? []
  )
  const [generatedPlan, setGeneratedPlan] = useState<CourseEntry[] | null>(null)

  // ---------- Filtered events ----------
  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      if (filterType !== 'all' && ev.type !== filterType) return false
      if (filterPriority !== 'all' && ev.priority !== filterPriority) return false
      if (filterCourse && !ev.course.toLowerCase().includes(filterCourse.toLowerCase())) return false
      return true
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [events, filterType, filterPriority, filterCourse])

  // ---------- Handlers ----------

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.course || !newEvent.date) return
    createEvent(
      { ...newEvent, date: new Date(newEvent.date).toISOString() },
      {
        onSuccess: () => {
          setShowEventModal(false)
          setNewEvent(emptyEvent)
        },
      }
    )
  }

  const handleAddCourse = () => {
    if (!courseForm.course) return
    const colorIndex = planCourses.length % COURSE_COLORS.length
    const newCourse: CourseEntry = {
      ...courseForm,
      color: COURSE_COLORS[colorIndex],
      weeklyPlan: [], // populated on generate
    }
    setPlanCourses(prev => [...prev, newCourse])
    setCourseForm(emptyCourse)
  }

  const handleRemoveCourse = (index: number) => {
    setPlanCourses(prev => prev.filter((_, i) => i !== index))
    if (generatedPlan) setGeneratedPlan(prev => prev?.filter((_, i) => i !== index) ?? null)
  }

  const handleGeneratePlan = () => {
    if (planCourses.length === 0) return
    const generated = planCourses.map(c => ({
      ...c,
      weeklyPlan: generateWeeklyPlan(c.priority, c.preparation),
    }))
    setGeneratedPlan(generated)
    savePlan({ courses: generated })
  }

  // Max hours across all days, for bar scaling
  const maxHoursInPlan = useMemo(() => {
    if (!generatedPlan) return 1
    return Math.max(
      1,
      ...DAYS.map(day =>
        generatedPlan.reduce((sum, c) => {
          const d = c.weeklyPlan.find(w => w.day === day)
          return sum + (d?.hours ?? 0)
        }, 0)
      )
    )
  }, [generatedPlan])

  const hasActiveFilters = filterType !== 'all' || filterPriority !== 'all' || filterCourse !== ''

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Scheduler</h1>
        <p className="text-gray-500">Manage your deadlines and study schedule</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ====== LEFT: Events ====== */}
        <div className="xl:col-span-2 space-y-6">

          {/* Quick Actions */}
          <Card>
            <div className="flex gap-4">
              <Button
                onClick={() => setShowEventModal(true)}
                icon={<Plus className="w-5 h-5" />}
                fullWidth
              >
                Add Event
              </Button>
              <Button
                variant="outline"
                icon={<CalendarIcon className="w-5 h-5" />}
                fullWidth
                onClick={() => window.open('https://calendar.google.com', '_blank')}
              >
                Google Calendar
              </Button>
            </div>
          </Card>

          {/* Upcoming Events + Filters */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Upcoming Events</h3>
              <button
                onClick={() => setShowFilters(v => !v)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  hasActiveFilters
                    ? 'bg-[#667eea]/10 text-[#667eea]'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {hasActiveFilters && (
                  <span className="w-5 h-5 bg-[#667eea] text-white rounded-full text-xs flex items-center justify-center">
                    {[filterType !== 'all', filterPriority !== 'all', filterCourse !== ''].filter(Boolean).length}
                  </span>
                )}
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Filter Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mb-4 p-4 bg-gray-50 rounded-xl space-y-3">
                    {/* Course name search */}
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Filter by course name..."
                        value={filterCourse}
                        onChange={e => setFilterCourse(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                      />
                      {filterCourse && (
                        <button onClick={() => setFilterCourse('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {/* Type filter */}
                      <div className="flex-1 min-w-36">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                        <div className="flex flex-wrap gap-1">
                          <button
                            onClick={() => setFilterType('all')}
                            className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                              filterType === 'all' ? 'bg-[#667eea] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          >All</button>
                          {EVENT_TYPE_OPTIONS.map(t => (
                            <button
                              key={t}
                              onClick={() => setFilterType(t)}
                              className={`px-2 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                                filterType === t ? 'bg-[#667eea] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                              }`}
                            >{t}</button>
                          ))}
                        </div>
                      </div>

                      {/* Priority filter */}
                      <div className="flex-1 min-w-36">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setFilterPriority('all')}
                            className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                              filterPriority === 'all' ? 'bg-[#667eea] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          >All</button>
                          {PRIORITY_OPTIONS.map(p => (
                            <button
                              key={p}
                              onClick={() => setFilterPriority(p)}
                              className={`px-2 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                                filterPriority === p ? 'bg-[#667eea] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                              }`}
                            >{p}</button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {hasActiveFilters && (
                      <button
                        onClick={() => { setFilterType('all'); setFilterPriority('all'); setFilterCourse('') }}
                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Events list */}
            {eventsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No events found</p>
                <p className="text-sm mt-1">
                  {hasActiveFilters ? 'Try adjusting your filters' : 'Add your first event above'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.03 }}
                      className="group flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className={`px-3 py-1 rounded-lg text-xs font-semibold border flex-shrink-0 ${eventTypeColors[event.type]}`}>
                        {event.type.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">{event.title}</h4>
                        <p className="text-sm text-gray-600">{event.course}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                        {event.time && <p className="text-xs text-gray-500">{event.time}</p>}
                      </div>
                      <div className={`w-2 h-12 rounded-full flex-shrink-0 ${priorityBarColors[event.priority]}`} />
                      <button
                        onClick={() => deleteEvent(event.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </Card>

          {/* ====== Overall Study Plan Chart ====== */}
          {generatedPlan && generatedPlan.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Weekly Study Plan</h3>
                    <p className="text-sm text-gray-500 mt-1">Stacked hours per day across all courses</p>
                  </div>
                  {/* Legend */}
                  <div className="flex flex-wrap gap-3 justify-end max-w-xs">
                    {generatedPlan.map(c => (
                      <div key={c.course} className="flex items-center gap-1.5">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: c.color }}
                        />
                        <span className="text-xs text-gray-600 whitespace-nowrap">{c.course}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stacked bar chart */}
                <div className="space-y-3">
                  {DAYS.map((day, di) => {
                    const dayEntries = generatedPlan.map(c => ({
                      course: c.course,
                      color: c.color,
                      hours: c.weeklyPlan.find(w => w.day === day)?.hours ?? 0,
                    })).filter(e => e.hours > 0)

                    const totalHours = dayEntries.reduce((s, e) => s + e.hours, 0)
                    const barWidth = (totalHours / maxHoursInPlan) * 100

                    return (
                      <div key={day} className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-500 w-10 flex-shrink-0">{day}</span>
                        <div className="flex-1 h-9 bg-gray-100 rounded-lg overflow-hidden relative group/bar">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${barWidth}%` }}
                            transition={{ delay: di * 0.08, duration: 0.5, ease: 'easeOut' }}
                            className="h-full flex"
                          >
                            {dayEntries.map((entry, ei) => {
                              const segWidth = totalHours > 0 ? (entry.hours / totalHours) * 100 : 0
                              return (
                                <div
                                  key={entry.course}
                                  style={{ width: `${segWidth}%`, backgroundColor: entry.color }}
                                  className="h-full relative group/seg"
                                  title={`${entry.course}: ${entry.hours}h`}
                                >
                                  {/* Tooltip on hover */}
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/seg:block z-10 pointer-events-none">
                                    <div className="bg-gray-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap shadow-lg">
                                      {entry.course}: {entry.hours}h
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </motion.div>
                          {/* Total label */}
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-600">
                            {totalHours.toFixed(1)}h
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Summary */}
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {generatedPlan.map(c => {
                    const total = c.weeklyPlan.reduce((s, d) => s + d.hours, 0)
                    return (
                      <div
                        key={c.course}
                        className="p-3 rounded-xl border"
                        style={{ borderColor: c.color + '40', backgroundColor: c.color + '0d' }}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                          <span className="text-xs font-semibold text-gray-700 truncate">{c.course}</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">{total.toFixed(1)}h</p>
                        <p className="text-xs text-gray-500">this week</p>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </motion.div>
          )}
        </div>

        {/* ====== RIGHT: Study Plan Generator ====== */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-purple-50 to-blue-50">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">AI Study Plan</h3>
              <p className="text-sm text-gray-500">Add courses to generate your weekly schedule</p>
              <p className="text-xs text-gray-400 mt-1 italic">(AI personalisation in next iteration)</p>
            </div>

            {/* Add course form */}
            <div className="space-y-3 mb-4">
              <Input
                label="Course Name"
                placeholder="e.g., Data Structures"
                value={courseForm.course}
                onChange={e => setCourseForm({ ...courseForm, course: e.target.value })}
              />

              <div>
                <label className="block text-sm mb-2 text-gray-700">
                  Preparation: <span className="font-semibold text-[#667eea]">{courseForm.preparation}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={courseForm.preparation}
                  onChange={e => setCourseForm({ ...courseForm, preparation: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#667eea]"
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700">Priority</label>
                <div className="grid grid-cols-3 gap-2">
                  {PRIORITY_OPTIONS.map(p => (
                    <button
                      key={p}
                      onClick={() => setCourseForm({ ...courseForm, priority: p })}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                        courseForm.priority === p
                          ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-sm'
                          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={handleAddCourse} fullWidth variant="outline" icon={<Plus className="w-4 h-4" />}>
                Add Course
              </Button>
            </div>

            {/* Added courses list */}
            {planCourses.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Courses</p>
                <AnimatePresence>
                  {planCourses.map((c, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-gray-200"
                    >
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="flex-1 text-sm font-medium text-gray-800 truncate">{c.course}</span>
                      <span className="text-xs text-gray-500">{c.preparation}% · {c.priority}</span>
                      <button
                        onClick={() => handleRemoveCourse(i)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            <Button
              onClick={handleGeneratePlan}
              fullWidth
              disabled={planCourses.length === 0}
              icon={<Target className="w-5 h-5" />}
            >
              Generate Plan
            </Button>
          </Card>

          {/* Per-course breakdown after generation */}
          {generatedPlan && (
            <AnimatePresence>
              {generatedPlan.map((plan, pi) => (
                <motion.div
                  key={plan.course}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: pi * 0.1 }}
                >
                  <Card>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: plan.color }} />
                      <h3 className="text-base font-semibold text-gray-900">{plan.course}</h3>
                    </div>
                    <div className="space-y-2">
                      {plan.weeklyPlan.map((dayPlan, di) => (
                        <div key={di} className="flex items-center gap-3">
                          <span className="text-sm text-gray-500 w-10">{dayPlan.day}</span>
                          <div className="flex-1 h-7 bg-gray-100 rounded-lg overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(dayPlan.hours / 4) * 100}%` }}
                              transition={{ delay: di * 0.06 + pi * 0.2 }}
                              className="h-full flex items-center justify-end px-2 rounded-lg"
                              style={{ backgroundColor: plan.color }}
                              title={`${dayPlan.hours}h`}
                            >
                              <span className="text-xs font-semibold text-white">{dayPlan.hours}h</span>
                            </motion.div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span className="font-semibold">
                        {plan.weeklyPlan.reduce((s, d) => s + d.hours, 0).toFixed(1)}h total / week
                      </span>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* ====== Add Event Modal ====== */}
      <Modal
        isOpen={showEventModal}
        onClose={() => { setShowEventModal(false); setNewEvent(emptyEvent) }}
        title="Add New Event"
      >
        <div className="space-y-4">
          <Input
            label="Event Title"
            placeholder="e.g., Assignment 3"
            value={newEvent.title}
            onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
            required
          />
          <Input
            label="Course"
            placeholder="e.g., Data Structures"
            value={newEvent.course}
            onChange={e => setNewEvent({ ...newEvent, course: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm mb-2 text-gray-700">Event Type</label>
            <select
              value={newEvent.type}
              onChange={e => setNewEvent({ ...newEvent, type: e.target.value as EventType })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
            >
              {EVENT_TYPE_OPTIONS.map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={newEvent.date}
              onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
              required
            />
            <Input
              label="Time (optional)"
              type="time"
              value={newEvent.time}
              onChange={e => setNewEvent({ ...newEvent, time: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm mb-2 text-gray-700">Priority</label>
            <div className="grid grid-cols-3 gap-2">
              {PRIORITY_OPTIONS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setNewEvent({ ...newEvent, priority: p })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                    newEvent.priority === p
                      ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => { setShowEventModal(false); setNewEvent(emptyEvent) }} fullWidth>
              Cancel
            </Button>
            <Button onClick={handleAddEvent} fullWidth disabled={creating}>
              {creating ? 'Adding...' : 'Add Event'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}