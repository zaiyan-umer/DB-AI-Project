import { useState, useMemo, useEffect } from 'react'
import { Calendar as CalendarIcon, Plus, Clock, Target, Zap, Trash2, Search, SlidersHorizontal, X, ChevronDown, CheckCircle2, XCircle, TrendingDown, TrendingUp, Save, Check, RefreshCw, AlertTriangle, } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Modal } from '../components/Modal'
import { Input } from '../components/Input'
import { useEvents, useCreateEvent, useDeleteEvent, useStudyPlan, useSaveStudyPlan, usePlanLogs, useSavePlanLogs, useDeleteCourseData, } from '../hooks/useScheduler'
import type { EventType, Priority, CourseEntry, StudyStatus, DayStatus } from '../services/scheduler.service'

// ── Constants ────────────────────────────────────────────────────────────────

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Course colors — deliberately chosen to NOT overlap with status colors
// Avoiding: #22c55e (green), #ef4444 (red), #f59e0b (amber), #667eea (purple/blue used for greater_than)
const COURSE_COLORS = [
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#8b5cf6', // violet
  '#f97316', // orange
  '#14b8a6', // teal
  '#a855f7', // purple
  '#0ea5e9', // sky
  '#d946ef', // fuchsia
  '#84cc16', // lime
  '#fb7185', // rose
]

// Status colors — fixed, never change
const STATUS_CONFIG: Record<StudyStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
    complete:     { label: 'Complete',     color: '#16a34a', bg: '#dcfce7', border: '#86efac', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    missed:       { label: 'Missed',       color: '#dc2626', bg: '#fee2e2', border: '#fca5a5', icon: <XCircle className="w-3.5 h-3.5" /> },
    less_than:    { label: 'Less Than',    color: '#d97706', bg: '#fef3c7', border: '#fcd34d', icon: <TrendingDown className="w-3.5 h-3.5" /> },
    greater_than: { label: 'Greater Than', color: '#2563eb', bg: '#dbeafe', border: '#93c5fd', icon: <TrendingUp className="w-3.5 h-3.5" /> },
}


const STATUS_OPTIONS = Object.entries(STATUS_CONFIG) as [StudyStatus, typeof STATUS_CONFIG[StudyStatus]][]

const EVENT_TYPE_OPTIONS: EventType[] = ['assignment', 'quiz', 'mid', 'final', 'project', 'study']
const PRIORITY_OPTIONS: Priority[] = ['low', 'medium', 'high']

const eventTypeColors: Record<EventType, string> = {
  assignment: 'bg-blue-100 text-blue-700 border-blue-200',
  quiz:       'bg-yellow-100 text-yellow-700 border-yellow-200',
  mid:        'bg-red-100 text-red-700 border-red-200',
  final:      'bg-purple-100 text-purple-700 border-purple-200',
  project:    'bg-green-100 text-green-700 border-green-200',
  study:      'bg-indigo-100 text-indigo-700 border-indigo-200',
}

const priorityBarColors: Record<Priority, string> = {
  high: 'bg-red-500', medium: 'bg-yellow-500', low: 'bg-green-500',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const emptyEvent = { title: '', type: 'assignment' as EventType, date: '', time: '', course: '', priority: 'medium' as Priority }
const emptyCourse = { course: '', preparation: 30, priority: 'medium' as Priority }

function generateWeeklyPlan(priority: Priority, preparation: number) {
  const total = priority === 'high' ? 20 : priority === 'medium' ? 15 : 10
  const adjusted = total * (1 - preparation / 100) + 2
  const perDay = adjusted / 7
  return DAYS.map(dayOfWeek => ({
    dayOfWeek,
    hours: Math.max(0.5, Math.round((Math.random() * 0.5 + 0.75) * perDay * 10) / 10),
  }))
}

/** Returns the Monday of the current week as "YYYY-MM-DD" */
function getCurrentWeekStart(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  return monday.toISOString().split('T')[0]
}

/** True if weekStart string is the current week */
function isCurrentWeek(weekStart: string): boolean {
  return weekStart === getCurrentWeekStart()
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SchedulerPage() {
  const { data: events = [], isLoading: eventsLoading } = useEvents()
  const { data: savedPlan, isLoading: planLoading } = useStudyPlan()
  const { data: existingLogs = [] } = usePlanLogs()
  const { mutate: createEvent, isPending: creating } = useCreateEvent()
  const { mutate: delEvent } = useDeleteEvent()
  const { mutate: savePlan, isPending: savingPlan } = useSaveStudyPlan()
  const { mutate: saveLog, isPending: savingLog } = useSavePlanLogs()
  const { mutate: deleteCourse, isPending: deletingCourse } = useDeleteCourseData()

  // ── Event modal ──
  const [showEventModal, setShowEventModal] = useState(false)
  const [newEvent, setNewEvent] = useState(emptyEvent)

  // ── Filters ──
  const [filterType, setFilterType]         = useState<EventType | 'all'>('all')
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all')
  const [filterCourse, setFilterCourse]     = useState('')
  const [showFilters, setShowFilters]       = useState(false)

  // ── Study plan generator ──
  const [courseForm, setCourseForm]       = useState(emptyCourse)
  const [pendingCourses, setPendingCourses] = useState<CourseEntry[]>([])
  const [generatedDraft, setGeneratedDraft] = useState<CourseEntry[] | null>(null)

  // ── Confirmed courses (loaded from DB) ──
  const [confirmedCourses, setConfirmedCourses] = useState<CourseEntry[]>([])

  // ── Which confirmed course mini-charts are expanded ──
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set())

  // ── Day statuses: course → DayStatus[7] (Mon-Sun) ──
  const [courseStatuses, setCourseStatuses] = useState<Record<string, DayStatus[]>>({})
  const [unsavedCourses, setUnsavedCourses] = useState<Set<string>>(new Set())

  // ── Delete confirmation ──
  const [deleteTarget, setDeleteTarget] = useState<CourseEntry | null>(null)

  // ── Regenerate state: course → new weeklyPlan (pending confirmation) ──
  const [regenPreviews, setRegenPreviews] = useState<Record<string, { dayOfWeek: string; hours: number }[]>>({})

  // CHANGES
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [savedState, setSavedState] = useState<{courseStatuses: Record<string, DayStatus[]>; confirmedCourses: CourseEntry[]} | null>(null)

  // ── Load confirmed courses from DB on mount ──
  // All courses in the DB are confirmed by definition — no confirmed flag is
  // ever persisted, so filtering by it would always return [].
  useEffect(() => {
    if (planLoading || !savedPlan) return
    const courses = (savedPlan.courses as CourseEntry[]) ?? []
    setConfirmedCourses(courses)
  }, [savedPlan, planLoading])

  // ── Load existing logs into courseStatuses ──
  // Logs are now one row per day. Rebuild the [7] status array per course uuid.
  useEffect(() => {
    if (!existingLogs.length) return
    const weekStart = getCurrentWeekStart()
    const map: Record<string, DayStatus[]> = {}
    existingLogs.forEach((log: any) => {
      if (log.weekStart?.startsWith(weekStart)) {
        const key = log.studyPlanCourseId
        if (!map[key]) map[key] = Array(7).fill(null)
        map[key][log.dayOfWeek] = log.status as DayStatus
      }
    })
    setCourseStatuses(map)
  }, [existingLogs])

  useEffect(() => {
    if (confirmedCourses.length > 0 && !savedState) {
      captureSavedState()
    }
  }, [confirmedCourses])

  // ── Filtered events ──
  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      if (filterType !== 'all' && ev.type !== filterType) return false
      if (filterPriority !== 'all' && ev.priority !== filterPriority) return false
      if (filterCourse && !ev.course.toLowerCase().includes(filterCourse.toLowerCase())) return false
      return true
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [events, filterType, filterPriority, filterCourse])

  // ── Chart: only confirmed courses, uses status color if set ──
  const maxHoursInChart = useMemo(() => {
    if (!confirmedCourses.length) return 1
    return Math.max(1, ...DAYS.map((_day, di) =>
      confirmedCourses.reduce((sum, c) => sum + (c.weeklyPlan[di]?.hours ?? 0), 0)
    ))
  }, [confirmedCourses])

  const hasActiveFilters = filterType !== 'all' || filterPriority !== 'all' || filterCourse !== ''

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.course || !newEvent.date) return
    createEvent({ ...newEvent, date: new Date(newEvent.date).toISOString() }, {
      onSuccess: () => { setShowEventModal(false); setNewEvent(emptyEvent) },
    })
  }

  const handleAddCourse = () => {
    if (!courseForm.course) return
    if (pendingCourses.find(c => c.course.toLowerCase() === courseForm.course.toLowerCase())) return
    const colorIndex = (confirmedCourses.length + pendingCourses.length) % COURSE_COLORS.length
    setPendingCourses(prev => [...prev, { ...courseForm, color: COURSE_COLORS[colorIndex], weeklyPlan: [] }])
    setCourseForm(emptyCourse)
  }

  const handleGenerate = () => {
    if (!pendingCourses.length) return
    setGeneratedDraft(pendingCourses.map(c => ({
      ...c, confirmed: false, weeklyPlan: generateWeeklyPlan(c.priority, c.preparation),
    })))
  }

  const handleConfirmCourse = (entry: CourseEntry) => {
    // Strip any local-only flags before persisting
    const cleanEntry: CourseEntry = {
      course:      entry.course,
      preparation: entry.preparation,
      priority:    entry.priority,
      color:       entry.color,
      weeklyPlan:  entry.weeklyPlan,
    }

    // Use functional updater so we always get the latest list — avoids the
    // stale-closure bug where confirmedCourses is [] at call time.
    let updatedList: CourseEntry[] = []
    setConfirmedCourses(prev => {
      const exists = prev.find(c => c.course === entry.course)
      updatedList = exists
        ? prev.map(c => c.course === entry.course ? cleanEntry : c)
        : [...prev, cleanEntry]
      return updatedList
    })

    setGeneratedDraft(prev => prev?.filter(c => c.course !== entry.course) ?? null)
    setPendingCourses(prev => prev.filter(c => c.course !== entry.course))

    // setTimeout(0) lets the setState above flush so updatedList is populated
    setTimeout(() => savePlan({ courses: updatedList }), 0)

    setExpandedCourses(prev => new Set(prev).add(entry.course))
  }

  const handleCancelDraft = (course: string) => {
    setGeneratedDraft(prev => prev?.filter(c => c.course !== course) ?? null)
    // Put back in pending if not already confirmed
    const isConfirmed = confirmedCourses.find(c => c.course === course)
    if (!isConfirmed) {
      const draft = generatedDraft?.find(c => c.course === course)
      if (draft) setPendingCourses(prev => [...prev, { ...draft, weeklyPlan: [] }])
    }
  }

  const handleRegenerateCourse = (course: CourseEntry) => {
    // Generate new hours and store as a preview on the confirmed card itself
    const newPlan = generateWeeklyPlan(course.priority, course.preparation)
    setRegenPreviews(prev => ({ ...prev, [course.course]: newPlan }))
  }

  const handleConfirmRegen = (course: CourseEntry) => {
    const newPlan = regenPreviews[course.course]
    if (!newPlan) return
    const updated: CourseEntry[] = confirmedCourses.map(c =>
      c.course === course.course ? { ...c, weeklyPlan: newPlan } : c
    )
    setConfirmedCourses(updated)
    const statusKey = course.id ?? course.course
    setCourseStatuses(prev => ({ ...prev, [statusKey]: Array(7).fill(null) }))
    setUnsavedCourses(prev => new Set(prev).add(course.course))
    setRegenPreviews(prev => { const n = { ...prev }; delete n[course.course]; return n })
    savePlan({ courses: updated })
    setHasUnsavedChanges(true)
  }
  const handleCancelRegen = (courseName: string) => {
    setRegenPreviews(prev => { const n = { ...prev }; delete n[courseName]; return n })
  }

  const toggleExpand = (course: string) => {
    setExpandedCourses(prev => {
      const next = new Set(prev)
      if (next.has(course)) next.delete(course)
      else next.add(course)
      return next
    })
  }

    const handleSetStatus = (course: CourseEntry, dayIndex: number, status: StudyStatus) => {
    const key = course.id ?? course.course
    setCourseStatuses(prev => {
      const current = prev[key] ?? Array(7).fill(null)
      const updated = [...current]
      updated[dayIndex] = updated[dayIndex] === status ? null : status
      return { ...prev, [key]: updated }
    })
    setUnsavedCourses(prev => new Set(prev).add(course.course))
    setHasUnsavedChanges(true)
  }

  // Add this function to capture the saved state (add it near your other handlers)
  const captureSavedState = () => {
    setSavedState({
      courseStatuses: JSON.parse(JSON.stringify(courseStatuses)),
      confirmedCourses: JSON.parse(JSON.stringify(confirmedCourses))
    })
    setHasUnsavedChanges(false)
  }

  // Add this function to handle cancel (add it near your other handlers)
  const handleCancelChanges = () => {
    if (savedState) {
      setCourseStatuses(savedState.courseStatuses)
      setConfirmedCourses(savedState.courseStatuses ? 
        confirmedCourses.map(c => ({
          ...c,
          weeklyPlan: savedState.confirmedCourses.find(sc => sc.course === c.course)?.weeklyPlan || c.weeklyPlan
        })) : 
        confirmedCourses
      )
      setUnsavedCourses(new Set())
      setHasUnsavedChanges(false)
    }
  }

  const handleSaveStatus = (course: CourseEntry) => {
    if (!course.id) return   // course.id is the study_plan_courses uuid
    const statuses = courseStatuses[course.id] ?? Array(7).fill(null)
    saveLog({
      studyPlanCourseId: course.id,
      scheduledHours: course.weeklyPlan.map(d => d.hours),
      dayStatuses: statuses,
    }, {
      onSuccess: () => {
        setUnsavedCourses(prev => { const n = new Set(prev); n.delete(course.course); return n })
        if (unsavedCourses.size <= 1) captureSavedState()
      },
    })
  }

  const handleDeleteCourse = () => {
    if (!deleteTarget?.id) return
    deleteCourse({ studyPlanCourseId: deleteTarget.id }, {
      onSuccess: () => {
        setConfirmedCourses(prev => prev.filter(c => c.course !== deleteTarget.course))
        setCourseStatuses(prev => { const n = { ...prev }; delete n[deleteTarget.id!]; return n })
        setExpandedCourses(prev => { const n = new Set(prev); n.delete(deleteTarget.course); return n })
        setDeleteTarget(null)
      },
    })
  }

  // ── Bar colour for chart segment ──
  // If all 7 days of that course have a single status, tint the bar that colour.
  // Otherwise use course colour.
  const getChartBarColor = (course: CourseEntry, dayIndex: number): string => {
    const key = course.id ?? course.course
    const status = courseStatuses[key]?.[dayIndex]
    if (status) return STATUS_CONFIG[status].color
    return course.color
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-12">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Scheduler</h1>
        <p className="text-gray-500">Manage your deadlines and study schedule</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ══ LEFT ══ */}
        <div className="xl:col-span-2 space-y-6">

          {/* Quick actions */}
          <Card>
            <div className="flex gap-4">
              <Button onClick={() => setShowEventModal(true)} icon={<Plus className="w-5 h-5" />} fullWidth>Add Event</Button>
              <Button variant="outline" icon={<CalendarIcon className="w-5 h-5" />} fullWidth
                onClick={() => window.open('https://calendar.google.com', '_blank')}>
                Google Calendar
              </Button>
            </div>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Upcoming Events</h3>
              <button onClick={() => setShowFilters(v => !v)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${hasActiveFilters ? 'bg-[#667eea]/10 text-[#667eea]' : 'text-gray-600 hover:bg-gray-100'}`}>
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

            <AnimatePresence>
              {showFilters && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="mb-4 p-4 bg-gray-50 rounded-xl space-y-3">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" placeholder="Filter by course name..." value={filterCourse}
                        onChange={e => setFilterCourse(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]" />
                      {filterCourse && <button onClick={() => setFilterCourse('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-3.5 h-3.5 text-gray-400" /></button>}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <div className="flex-1 min-w-36">
                        <p className="text-xs font-medium text-gray-600 mb-1">Type</p>
                        <div className="flex flex-wrap gap-1">
                          {(['all', ...EVENT_TYPE_OPTIONS] as const).map(t => (
                            <button key={t} onClick={() => setFilterType(t as any)}
                              className={`px-2 py-1 rounded-md text-xs font-medium capitalize transition-colors ${filterType === t ? 'bg-[#667eea] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                              {t === 'all' ? 'All' : t}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex-1 min-w-36">
                        <p className="text-xs font-medium text-gray-600 mb-1">Priority</p>
                        <div className="flex gap-1">
                          {(['all', ...PRIORITY_OPTIONS] as const).map(p => (
                            <button key={p} onClick={() => setFilterPriority(p as any)}
                              className={`px-2 py-1 rounded-md text-xs font-medium capitalize transition-colors ${filterPriority === p ? 'bg-[#667eea] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                              {p === 'all' ? 'All' : p}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    {hasActiveFilters && (
                      <button onClick={() => { setFilterType('all'); setFilterPriority('all'); setFilterCourse('') }}
                        className="text-xs text-red-500 hover:text-red-700 font-medium">Clear all filters</button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {eventsLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No events found</p>
                <p className="text-sm mt-1">{hasActiveFilters ? 'Try adjusting your filters' : 'Add your first event above'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredEvents.map((ev, i) => (
                    <motion.div key={ev.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.03 }}
                      className="group flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className={`px-3 py-1 rounded-lg text-xs font-semibold border flex-shrink-0 ${eventTypeColors[ev.type]}`}>
                        {ev.type.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">{ev.title}</h4>
                        <p className="text-sm text-gray-600">{ev.course}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                        {ev.time && <p className="text-xs text-gray-500">{ev.time}</p>}
                      </div>
                      <div className={`w-2 h-12 rounded-full flex-shrink-0 ${priorityBarColors[ev.priority]}`} />
                      <button onClick={() => delEvent(ev.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-100 text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </Card>

          {/* ── Stacked bar chart ── */}
          {confirmedCourses.length > 0 && (
            <Card>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Weekly Study Plan</h3>
                  <p className="text-sm text-gray-400 mt-0.5">Click a course box below to expand its detail chart</p>
                </div>
                {/* Course legend — color dot + name only, no hours */}
                <div className="flex flex-wrap gap-3 justify-end max-w-xs">
                  {confirmedCourses.map(c => (
                    <div key={c.course} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="text-xs text-gray-600 whitespace-nowrap">{c.course}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stacked bars */}
              <div className="space-y-3">
                {DAYS.map((day, di) => {
                  const dayEntries = confirmedCourses.map(c => ({
                    course: c.course,
                    color: getChartBarColor(c, di),
                    hours: c.weeklyPlan[di]?.hours ?? 0,
                    status: courseStatuses[c.course]?.[di],
                  })).filter(e => e.hours > 0)

                  const totalHours = dayEntries.reduce((s, e) => s + e.hours, 0)
                  const barWidthPct = (totalHours / maxHoursInChart) * 100

                  return (
                    <div key={day} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500 w-10 flex-shrink-0">{day}</span>
                      <div className="flex-1 h-9 bg-gray-100 rounded-lg overflow-visible relative">
                        <div className="absolute inset-0 overflow-hidden rounded-lg">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${barWidthPct}%` }}
                          transition={{ delay: di * 0.07, duration: 0.5, ease: 'easeOut' }}
                          className="h-full flex">
                          {dayEntries.map(entry => {
                            const segPct = totalHours > 0 ? (entry.hours / totalHours) * 100 : 0
                            return (
                              <div key={entry.course}
                                style={{ width: `${segPct}%`, backgroundColor: entry.color }}
                                className="h-full relative group/seg">
                              </div>
                            )
                          })}
                        </motion.div>
                        </div>
                        {/* Tooltips rendered outside the clipped div */}
                        <div className="absolute inset-0 flex pointer-events-none" style={{ width: `${barWidthPct}%` }}>
                          {dayEntries.map(entry => {
                            const segPct = totalHours > 0 ? (entry.hours / totalHours) * 100 : 0
                            return (
                              <div key={entry.course} style={{ width: `${segPct}%` }}
                                className="h-full relative group/seg pointer-events-auto">
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/seg:block z-20 pointer-events-none">
                                  <div className="bg-gray-900 text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg">
                                    {entry.course}: {entry.hours}h{entry.status ? ` · ${STATUS_CONFIG[entry.status].label}` : ''}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 pointer-events-none z-10">
                          {totalHours.toFixed(1)}h
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Status legend */}
              <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap gap-4">
                {STATUS_OPTIONS.map(([key, cfg]) => (
                  <div key={key} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                    {cfg.label}
                  </div>
                ))}
              </div>

              {/* Summary cards */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {confirmedCourses.map(c => {
                  const total = c.weeklyPlan.reduce((s, d) => s + d.hours, 0)
                  return (
                    <div key={c.course} className="p-3 rounded-xl border cursor-pointer transition-all hover:shadow-sm"
                      style={{ borderColor: c.color + '50', backgroundColor: c.color + '0e' }}
                      onClick={() => toggleExpand(c.course)}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                        <span className="text-xs font-semibold text-gray-700 truncate">{c.course}</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{total.toFixed(1)}h</p>
                      <p className="text-xs text-gray-400">this week · {expandedCourses.has(c.course) ? 'click to hide' : 'click to expand'}</p>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* ── Per-course expanded detail cards ── */}
          <AnimatePresence>
            {confirmedCourses.filter(c => expandedCourses.has(c.course)).map((plan, pi) => {
              const hasUnsaved = unsavedCourses.has(plan.course)
              const statuses = courseStatuses[plan.id ?? plan.course] ?? Array(7).fill(null)
              const regenPreview = regenPreviews[plan.course] // new hours pending confirm
              // Show regen preview hours if pending, otherwise confirmed hours
              const displayPlan = regenPreview
              ? DAYS.map((dayOfWeek, i) => ({ dayOfWeek, hours: regenPreview[i]?.hours ?? 0 }))
                : plan.weeklyPlan

              return (
                <motion.div key={plan.course} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }} transition={{ delay: pi * 0.05 }}>
                  <Card>
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: plan.color }} />
                      <h3 className="text-base font-semibold text-gray-900 flex-1">{plan.course}</h3>
                      {regenPreview ? (
                        // Regen pending — show save + cancel
                        <>
                          <span className="text-xs text-amber-600 font-medium px-2 py-1 bg-amber-50 rounded-full border border-amber-200">
                            New schedule preview
                          </span>
                          <button onClick={() => handleConfirmRegen(plan)}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 transition-colors">
                            <Check className="w-3 h-3" />
                          </button>
                          <button onClick={() => handleCancelRegen(plan.course)}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-red-600 hover:bg-gray-50 transition-colors">
                            <X className="w-3 h-3" /> 
                          </button>
                        </>
                      ) : (
                        // Normal state
                        <>
                          <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full font-medium flex items-center gap-1 border border-green-200">
                            <Check className="w-3 h-3" /> Confirmed
                          </span>
                          <button onClick={() => handleRegenerateCourse(plan)}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                            <RefreshCw className="w-3 h-3" /> 
                          </button>
                          <button onClick={() => setDeleteTarget(plan)}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-3 h-3" /> 
                          </button>
                        </>
                      )}
                    </div>

                    {/* Day rows */}
                    <div className="space-y-2">
                      {displayPlan.map((dayPlan, di) => {
                        const status = regenPreview ? null : statuses[di] // no status during preview
                        const statusCfg = status ? STATUS_CONFIG[status] : null
                        const barCol = statusCfg ? statusCfg.color : plan.color

                        return (
                          <div key={di} className="group/dayrow flex items-center gap-3">
                            <span className="text-sm text-gray-500 w-10 flex-shrink-0">{dayPlan.dayOfWeek}</span>

                            {/* Bar */}
                            <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
                              <motion.div initial={{ width: 0 }}
                                animate={{ width: `${Math.min((dayPlan.hours / 4) * 100, 100)}%` }}
                                transition={{ delay: di * 0.05 + pi * 0.1 }}
                                className="h-full flex items-center justify-end px-2 rounded-lg"
                                style={{ backgroundColor: barCol }}>
                                <span className="text-xs font-semibold text-white">{dayPlan.hours}h</span>
                              </motion.div>
                            </div>

                            {/* Status buttons — icon squares, visible on row hover, hidden during regen */}
                            {!regenPreview && (
                             <div className="flex items-center gap-1 opacity-0 group-hover/dayrow:opacity-100 transition-opacity flex-shrink-0">
                            {STATUS_OPTIONS.map(([key, cfg]) => (
                              <button
                                key={key}
                                onClick={() => handleSetStatus(plan, di, key)}
                                title={cfg.label}
                                className="p-1 rounded-md transition-all hover:scale-110"
                                style={{
                                  backgroundColor: status === key ? cfg.bg : 'transparent',
                                  color: cfg.color,
                                  border: `1px solid ${status === key ? cfg.color : 'transparent'}`,
                                }}
                              >
                                {cfg.icon}
                              </button>
                            ))}
                          </div>
                            )}

                            {/* Selected status label */}
                            {statusCfg && !regenPreview && (
                              <span className="text-xs font-medium flex-shrink-0" style={{ color: statusCfg.color, minWidth: '72px', textAlign: 'right' }}>
                                {statusCfg.label}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {!regenPreview && (
                      <div className="mt-5 flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span className="font-semibold">{plan.weeklyPlan.reduce((s, d) => s + d.hours, 0).toFixed(1)}h / week</span>
                        </div>
                        
                        {/* Group buttons together with a smaller gap */}
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleSaveStatus(plan)} 
                            disabled={!hasUnsaved || savingLog}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                            style={{
                              background: hasUnsaved ? 'linear-gradient(to right, #667eea, #764ba2)' : 'transparent',
                              color: hasUnsaved ? '#fff' : '#d1d5db',
                              border: hasUnsaved ? 'none' : '1px solid #e5e7eb',
                              cursor: hasUnsaved ? 'pointer' : 'not-allowed',
                            }}>
                            <Save className="w-3.5 h-3.5" />
                            {savingLog ? 'Saving…' : 'Save Progress'}
                          </button>
                          
                          <button 
                            onClick={handleCancelChanges}
                            disabled={!hasUnsavedChanges}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              hasUnsavedChanges 
                                ? 'bg-white border border-red-300 text-red-600 hover:bg-red-50' 
                                : 'bg-transparent border border-gray-200 text-gray-300 cursor-not-allowed'
                            }`}>
                            {/* <X className="w-3.5 h-3.5" /> */}
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* ── Draft cards (generated, not yet confirmed) ── */}
          {generatedDraft && generatedDraft.length > 0 && (
            <div className="space-y-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">Newly Generated — Confirm to save</p>
              <AnimatePresence>
                {generatedDraft.map((plan, pi) => (
                  <motion.div key={plan.course} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 20 }} transition={{ delay: pi * 0.08 }}>
                    <Card className="border-2 border-dashed border-[#667eea]/30">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: plan.color }} />
                        <h3 className="text-base font-semibold text-gray-900 flex-1">{plan.course}</h3>
                        <span className="text-xs text-[#667eea] font-medium px-2 py-1 bg-[#667eea]/10 rounded-full">Draft</span>
                      </div>

                      <div className="space-y-2 mb-5">
                        {plan.weeklyPlan.map((d, di) => (
                          <div key={di} className="flex items-center gap-3">
                            <span className="text-sm text-gray-500 w-10">{d.dayOfWeek}</span>
                            <div className="flex-1 h-7 bg-gray-100 rounded-lg overflow-hidden">
                              <motion.div initial={{ width: 0 }}
                                animate={{ width: `${Math.min((d.hours / 4) * 100, 100)}%` }}
                                transition={{ delay: di * 0.05 + pi * 0.1 }}
                                className="h-full flex items-center justify-end px-2 rounded-lg"
                                style={{ backgroundColor: plan.color }}>
                                <span className="text-xs font-semibold text-white">{d.hours}h</span>
                              </motion.div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span className="font-semibold">{plan.weeklyPlan.reduce((s, d) => s + d.hours, 0).toFixed(1)}h / week</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleCancelDraft(plan.course)}>Cancel</Button>
                          <Button size="sm" icon={<CheckCircle2 className="w-4 h-4" />}
                            onClick={() => handleConfirmCourse(plan)} disabled={savingPlan}>
                            {savingPlan ? 'Saving…' : 'Confirm'}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* ══ RIGHT: Generator ══ */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-purple-50 to-blue-50">
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">AI Study Plan</h3>
              <p className="text-sm text-gray-500">Add courses then generate your schedule</p>
              <p className="text-xs text-gray-400 mt-1 italic">(AI personalisation in next iteration)</p>
            </div>

            <div className="space-y-3 mb-4">
              <Input label="Course Name" placeholder="e.g., Data Structures"
                value={courseForm.course} onChange={e => setCourseForm({ ...courseForm, course: e.target.value })} />
              <div>
                <label className="block text-sm mb-2 text-gray-700">
                  Preparation: <span className="font-semibold text-[#667eea]">{courseForm.preparation}%</span>
                </label>
                <input type="range" min="0" max="100" value={courseForm.preparation}
                  onChange={e => setCourseForm({ ...courseForm, preparation: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#667eea]" />
              </div>
              <div>
                <label className="block text-sm mb-2 text-gray-700">Priority</label>
                <div className="grid grid-cols-3 gap-2">
                  {PRIORITY_OPTIONS.map(p => (
                    <button key={p} onClick={() => setCourseForm({ ...courseForm, priority: p })}
                      className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                        courseForm.priority === p
                          ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-sm'
                          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                      }`}>{p}</button>
                  ))}
                </div>
              </div>
              <Button onClick={handleAddCourse} fullWidth variant="outline" icon={<Plus className="w-4 h-4" />}>Add Course</Button>
            </div>

            {/* Pending */}
            {pendingCourses.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">To Generate</p>
                <AnimatePresence>
                  {pendingCourses.map((c, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                      className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-gray-200">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="flex-1 text-sm font-medium text-gray-800 truncate">{c.course}</span>
                      <span className="text-xs text-gray-400">{c.preparation}% · {c.priority}</span>
                      <button onClick={() => setPendingCourses(prev => prev.filter((_, j) => j !== i))}
                        className="text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Already confirmed */}
            {confirmedCourses.length > 0 && (
              <div className="space-y-1 mb-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Already Confirmed</p>
                {confirmedCourses.map(c => (
                  <div key={c.course} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-100">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="flex-1 text-sm text-gray-700 truncate">{c.course}</span>
                    <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}

            <Button onClick={handleGenerate} fullWidth disabled={!pendingCourses.length} icon={<Target className="w-5 h-5" />}>
              Generate Plan
            </Button>
          </Card>
        </div>
      </div>

      {/* ══ Add Event Modal ══ */}
      <Modal isOpen={showEventModal} onClose={() => { setShowEventModal(false); setNewEvent(emptyEvent) }} title="Add New Event">
        <div className="space-y-4">
          <Input label="Event Title" placeholder="e.g., Assignment 3" value={newEvent.title}
            onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} required />
          <Input label="Course" placeholder="e.g., Data Structures" value={newEvent.course}
            onChange={e => setNewEvent({ ...newEvent, course: e.target.value })} required />
          <div>
            <label className="block text-sm mb-2 text-gray-700">Event Type</label>
            <select value={newEvent.type} onChange={e => setNewEvent({ ...newEvent, type: e.target.value as EventType })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#667eea]">
              {EVENT_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date" type="date" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} required />
            <Input label="Time (optional)" type="time" value={newEvent.time} onChange={e => setNewEvent({ ...newEvent, time: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm mb-2 text-gray-700">Priority</label>
            <div className="grid grid-cols-3 gap-2">
              {PRIORITY_OPTIONS.map(p => (
                <button key={p} type="button" onClick={() => setNewEvent({ ...newEvent, priority: p })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                    newEvent.priority === p ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>{p}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => { setShowEventModal(false); setNewEvent(emptyEvent) }} fullWidth>Cancel</Button>
            <Button onClick={handleAddEvent} fullWidth disabled={creating}>{creating ? 'Adding...' : 'Add Event'}</Button>
          </div>
        </div>
      </Modal>

      {/* ══ Delete Confirmation Modal ══ */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Course" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700 mb-1">This action cannot be undone</p>
              <p className="text-sm text-red-600">
                Deleting <strong>{deleteTarget?.course}</strong> will remove it from your weekly plan
                and <strong>erase all its progress logs</strong> from the Progress page calculations.
                Think carefully before deleting.
              </p>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} fullWidth>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteCourse} fullWidth disabled={deletingCourse}>
              {deletingCourse ? 'Deleting…' : 'Delete Course'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}