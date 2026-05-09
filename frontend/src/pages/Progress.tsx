import { Award, BarChart3, BookOpen, Brain, CalendarCheck, CheckCircle2, FileStack, Flame, Layers, Loader2, Repeat, Target, TrendingUp, Trophy,} from 'lucide-react'
import { useMemo } from 'react'
import { useProgress } from '../hooks/useProgress'
import type { MonthlyProgressPoint, ProgressBadge } from '../services/progress.service'

const formatMonth = (value: string) => {
  const [year, month] = value.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'short' })
}

const clamp = (value: number) => Math.min(100, Math.max(0, value || 0))

const iconMap: Record<string, React.ReactNode> = {
  'calendar-check':  <CalendarCheck className="h-5 w-5" />,
  'check-circle':    <CheckCircle2 className="h-5 w-5" />,
  target:            <Target className="h-5 w-5" />,
  brain:             <Brain className="h-5 w-5" />,
  layers:            <Layers className="h-5 w-5" />,
  repeat:            <Repeat className="h-5 w-5" />,
  flame:             <Flame className="h-5 w-5" />,
  'flame-kindling':  <Flame className="h-5 w-5" />,
  'file-stack':      <FileStack className="h-5 w-5" />,
  books:             <BookOpen className="h-5 w-5" />,
  trophy:            <Trophy className="h-5 w-5" />,
}

/* ─── Shared card shell ────────────────────────────────────────────────── */
const Card = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
  <div
    className={`rounded-2xl border shadow-sm ${className}`}
    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
  >
    {children}
  </div>
)

/* ─── Stat card ────────────────────────────────────────────────────────── */
const StatCard = ({ title, value, subtitle, icon, }: {
  title: string; value: string | number; subtitle: string; icon: React.ReactNode
}) => (
  <Card className="p-5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{title}</p>
        <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
      </div>
      <div className="rounded-2xl p-3" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
        {icon}
      </div>
    </div>
    <p className="mt-3 text-sm" style={{ color: 'var(--text-faint)' }}>{subtitle}</p>
  </Card>
)

/* ─── Progress bar ─────────────────────────────────────────────────────── */
const ProgressBar = ({ value, color = 'bg-indigo-500' }: { value: number; color?: string }) => (
  <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--bg-muted)' }}>
    <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${clamp(value)}%` }} />
  </div>
)

/* ─── Monthly bar chart ────────────────────────────────────────────────── */
// bars now show ONLY completed schedule sessions so the bar height is
// consistent with the "X% done" label beneath each column.
// A second translucent layer shows missed sessions so the full picture is
// visible without mixing incompatible units (sessions vs MCQ attempts).
const MonthlyChart = ({ data }: { data: MonthlyProgressPoint[] }) => {
  const maxScheduled = Math.max(1, ...data.map((d) => d.scheduled))

  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Monthly Schedule Completion
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Sessions completed or exceeded vs. total scheduled per month.
          </p>
        </div>
        <BarChart3 className="h-6 w-6 flex-shrink-0" style={{ color: '#818cf8' }} />
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-4 text-xs" style={{ color: 'var(--text-faint)' }}>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-indigo-500" /> Completed / Over-time
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-400/60" /> Missed
        </span>
      </div>

      <div className="flex h-56 items-end gap-3 overflow-x-auto pb-2">
        {data.map((item) => {
          const completedH = maxScheduled > 0 ? Math.round((item.completed / maxScheduled) * 100) : 0
          const missedH    = maxScheduled > 0 ? Math.round((item.missed    / maxScheduled) * 100) : 0
          return (
            <div key={item.month} className="flex min-w-16 flex-1 flex-col items-center gap-2">
              {/* stacked bar: completed (bottom) + missed (top) */}
              <div className="flex h-40 w-full flex-col-reverse items-stretch overflow-hidden rounded-xl"
                   style={{ background: 'var(--bg-subtle)' }}>
                {/* completed — grows from bottom */}
                <div
                  className="w-full rounded-t-none bg-gradient-to-t from-indigo-600 to-indigo-400 transition-all"
                  style={{ height: `${completedH}%`, minHeight: completedH > 0 ? 4 : 0 }}
                  title={`${item.completed} completed`}
                />
                {/* missed — sits above completed */}
                <div
                  className="w-full bg-red-400/50 transition-all"
                  style={{ height: `${missedH}%`, minHeight: missedH > 0 ? 4 : 0 }}
                  title={`${item.missed} missed`}
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {formatMonth(item.month)}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {item.completionRate}%
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

/* ─── 30-day activity trend ────────────────────────────────────────────── */
// minimum bar height is now a fixed 6px so bars are always visible
// even in light mode; (b) days with zero activity show a faint baseline
// tick so the chart doesn't look blank; (c) a clear label explains this
// tracks ALL activity (schedule + MCQ + flashcards), separate from the
// streak which only counts fully-completed schedule days.
const TrendPanel = ({ data }: { data: { date: string; activityCount: number }[] }) => {
  const max = Math.max(1, ...data.map((d) => d.activityCount))
  const hasAnyActivity = data.some((d) => d.activityCount > 0)

  return (
    <Card className="p-6">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            30-Day Activity Trend
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            All study activity: schedule logs, MCQ attempts, and flashcard reviews.
          </p>
        </div>
        <TrendingUp className="h-6 w-6 flex-shrink-0 text-emerald-500" />
      </div>

      {/* Streak vs. trend note */}
      <p className="mb-5 rounded-xl px-3 py-2 text-xs" style={{ background: 'var(--bg-subtle)', color: 'var(--text-faint)' }}>
        Note: this trend counts every type of activity. Your{' '}
        <span className="font-semibold" style={{ color: 'var(--text-muted)' }}>streak</span>{' '}
        only counts days where every scheduled session was completed or exceeded.
      </p>

      {!hasAnyActivity ? (
        <div className="flex h-28 items-center justify-center rounded-xl text-sm"
             style={{ background: 'var(--bg-subtle)', color: 'var(--text-faint)' }}>
          No activity in the last 30 days yet.
        </div>
      ) : (
        <div className="relative flex h-28 items-end gap-0.5">
          {data.map((item) => {
            // Always render a visible baseline; scale from 6px min up to full height
            const pct = item.activityCount > 0
              ? Math.max(0, (item.activityCount / max) * 100)
              : 0
            return (
              <div key={item.date} className="flex flex-1 flex-col items-stretch justify-end" style={{ height: '100%' }}>
                {item.activityCount > 0 ? (
                  <div
                    className="w-full rounded-t bg-emerald-500 transition-all"
                    style={{ height: `${pct}%`, minHeight: '6px' }}
                    title={`${item.date}: ${item.activityCount} activities`}
                  />
                ) : (
                  /* zero-activity day: faint 2px tick so chart doesn't look blank */
                  <div
                    className="w-full rounded-t"
                    style={{ height: '2px', background: 'var(--bg-muted)' }}
                    title={`${item.date}: no activity`}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* X-axis: first, middle, last date labels */}
      {data.length > 0 && (
        <div className="mt-2 flex justify-between text-xs" style={{ color: 'var(--text-faint)' }}>
          <span>{data[0]?.date.slice(5)}</span>
          <span>{data[Math.floor(data.length / 2)]?.date.slice(5)}</span>
          <span>{data[data.length - 1]?.date.slice(5)}</span>
        </div>
      )}
    </Card>
  )
}

/* ─── Badge card ───────────────────────────────────────────────────────── */
const BadgeCard = ({ badge }: { badge: ProgressBadge }) => {
  const progress = badge.targetValue > 0
    ? Math.round((badge.progressValue / badge.targetValue) * 100)
    : 0

  return (
    <div
      className="rounded-2xl border p-5 transition"
      style={
        badge.earned
          ? { borderColor: 'rgba(251,191,36,0.4)', background: 'rgba(251,191,36,0.08)' }
          : { borderColor: 'var(--border)', background: 'var(--bg-subtle)' }
      }
    >
      <div className="flex items-start gap-4">
        <div
          className="rounded-2xl p-3"
          style={
            badge.earned
              ? { background: '#fbbf24', color: '#1c1917' }
              : { background: 'var(--bg-muted)', color: 'var(--text-muted)' }
          }
        >
          {iconMap[badge.icon] ?? <Award className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{badge.title}</h3>
            {badge.earned && (
              <span className="rounded-full bg-amber-400 px-2 py-1 text-xs font-bold text-stone-900">
                Earned
              </span>
            )}
          </div>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>{badge.description}</p>
          <div className="mt-4">
            <div className="mb-2 flex justify-between text-xs" style={{ color: 'var(--text-faint)' }}>
              <span>{Math.min(badge.progressValue, badge.targetValue)} / {badge.targetValue}</span>
              <span>{clamp(progress)}%</span>
            </div>
            <ProgressBar value={progress} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════ */
const ProgressPage = () => {
  const { data, isLoading, isError } = useProgress()

  const strongestCourse = useMemo(() => {
    if (!data?.courseBreakdown.length) return null
    return [...data.courseBreakdown].sort(
      (a, b) => b.mcqAccuracy - a.mcqAccuracy || b.mcqAttempts - a.mcqAttempts,
    )[0]
  }, [data])

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" style={{ color: 'var(--text-muted)' }}>
        <Loader2 className="mr-3 h-6 w-6 animate-spin" /> Loading progress analytics...
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-6 text-red-400">
        Failed to load progress analytics.
      </div>
    )
  }

  const { summary } = data

  const pendingSessions = Math.max(
    0,
    summary.totalScheduledSessions
    - summary.completedScheduledSessions
    - summary.missedScheduledSessions
    - summary.lessThanScheduledSessions,
  )

  return (
    <div className="space-y-8 p-6" style={{ color: 'var(--text-primary)' }}>

      {/* ── Header ── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-indigo-500">
            Progress Center
          </p>
          <h1 className="mt-2 text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Your learning momentum
          </h1>
          <p className="mt-2 max-w-2xl text-sm" style={{ color: 'var(--text-muted)' }}>
            Schedule completion, quiz performance, flashcard mastery, streaks, and course engagement.
          </p>
        </div>
        <Card className="px-5 py-4 text-right">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Badges earned</p>
          <p className="text-2xl font-bold text-amber-500">
            {summary.badgesEarned}/{summary.totalBadges}
          </p>
        </Card>
      </div>

      {/* ── Top stat cards ── */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Study Completion"
          value={`${summary.scheduleCompletionRate}%`}
          subtitle={`${summary.completedScheduledSessions} of ${summary.totalScheduledSessions} sessions honoured`}
          icon={<CalendarCheck className="h-6 w-6" />}
        />
        <StatCard
          title="MCQ Accuracy"
          value={`${summary.mcqAccuracy}%`}
          subtitle={`${summary.mcqAttempts} total attempts`}
          icon={<Target className="h-6 w-6" />}
        />
        <StatCard
          title="Flashcard Mastery"
          value={`${summary.flashcardMasteryRate}%`}
          subtitle={`${summary.flashcardsReviewed} cards reviewed`}
          icon={<Layers className="h-6 w-6" />}
        />
        <StatCard
          title="Current Streak"
          value={`${summary.currentStreak} days`}
          subtitle={`Best streak: ${summary.longestStreak} days`}
          icon={<Flame className="h-6 w-6" />}
        />
      </div>

      {/* ── Session breakdown ── */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Session Breakdown
          </h2>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Total: <strong style={{ color: 'var(--text-primary)' }}>{summary.totalScheduledSessions}</strong> sessions
          </span>
        </div>

        {/* Stacked proportion bar */}
        {summary.totalScheduledSessions > 0 && (
          <>
            <div className="flex h-4 w-full overflow-hidden rounded-full" style={{ background: 'var(--bg-muted)' }}>
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${(summary.completedScheduledSessions / summary.totalScheduledSessions) * 100}%` }}
                title="Completed / Over-time"
              />
              <div
                className="h-full bg-amber-400 transition-all"
                style={{ width: `${(summary.lessThanScheduledSessions / summary.totalScheduledSessions) * 100}%` }}
                title="Less than scheduled"
              />
              <div
                className="h-full bg-red-500 transition-all"
                style={{ width: `${(summary.missedScheduledSessions / summary.totalScheduledSessions) * 100}%` }}
                title="Missed"
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Completed / Over-time', count: summary.completedScheduledSessions, dot: 'bg-emerald-500' },
                { label: 'Less than scheduled',  count: summary.lessThanScheduledSessions,   dot: 'bg-amber-400' },
                { label: 'Missed',               count: summary.missedScheduledSessions,     dot: 'bg-red-500' },
                { label: 'Pending',              count: pendingSessions,                      dot: 'bg-indigo-400' },
              ].map(({ label, count, dot }) => (
                <div key={label} className="rounded-xl p-3" style={{ background: 'var(--bg-subtle)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`h-2 w-2 rounded-full flex-shrink-0 ${dot}`} />
                    <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{label}</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{count}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Streak rule callout */}
        <div className="mt-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm"
             style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
          <Flame className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500" />
          <span>
            <strong style={{ color: 'var(--text-secondary)' }}>Streak rule: </strong>
            a calendar day counts only when{' '}
            <em>every</em> session scheduled for that day is{' '}
            <span className="font-semibold text-emerald-500">Complete</span> or{' '}
            <span className="font-semibold text-emerald-500">Over-time</span>.
            A single <span className="font-semibold text-red-500">Missed</span> or{' '}
            <span className="font-semibold text-amber-500">Less-than</span> session breaks the streak for that day.
          </span>
        </div>
      </Card>

      {/* ── Monthly chart + Completion rates ── */}
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <MonthlyChart data={data.monthly} />

        <div className="space-y-6">
          {/* Completion rates */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Completion Rates
            </h2>
            <div className="mt-5 space-y-5">
              {[
                { label: 'This week (schedule)', value: summary.currentWeekCompletionRate },
                { label: 'MCQ accuracy',         value: summary.mcqAccuracy },
                { label: 'Flashcard mastery',    value: summary.flashcardMasteryRate },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{value}%</span>
                  </div>
                  <ProgressBar value={value} />
                </div>
              ))}
            </div>
          </Card>

          {/* Engagement */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Learning Engagement
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-4">
              {[
                { label: 'Courses', value: summary.coursesCreated },
                { label: 'Files',   value: summary.filesUploaded },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl p-4" style={{ background: 'var(--bg-subtle)' }}>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
                </div>
              ))}
            </div>
            {strongestCourse && (
              <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                Top quiz course:{' '}
                <span style={{ color: 'var(--text-secondary)' }}>{strongestCourse.courseName}</span>{' '}
                ({strongestCourse.mcqAccuracy}% accuracy)
              </p>
            )}
          </Card>
        </div>
      </div>

      {/* ── 30-day trend ── */}
      <TrendPanel data={data.dailyActivity} />

      {/* ── Course performance table ── */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Course Performance
        </h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                {['Course', 'Files', 'Flashcards', 'MCQs', 'Attempts', 'Accuracy'].map((h) => (
                  <th key={h} className="py-3 pr-4 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.courseBreakdown.map((course) => (
                <tr key={course.courseId} className="border-b"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                  <td className="py-3 pr-4 font-medium">{course.courseName}</td>
                  <td className="py-3 pr-4">{course.filesCount}</td>
                  <td className="py-3 pr-4">{course.flashcardsCount}</td>
                  <td className="py-3 pr-4">{course.mcqsCount}</td>
                  <td className="py-3 pr-4">{course.mcqAttempts}</td>
                  <td className="py-3 pr-4">{course.mcqAccuracy}%</td>
                </tr>
              ))}
              {data.courseBreakdown.length === 0 && (
                <tr>
                  <td className="py-8 text-center" colSpan={6} style={{ color: 'var(--text-faint)' }}>
                    No course activity yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Badges ── */}
      <div>
        <div className="mb-5 flex items-center gap-3">
          <Trophy className="h-7 w-7 text-amber-500" />
          <div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Badges & Achievements
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Persisted achievements synced from your study activity.
            </p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {data.badges.map((badge) => <BadgeCard key={badge.id} badge={badge} />)}
        </div>
      </div>

    </div>
  )
}

export default ProgressPage