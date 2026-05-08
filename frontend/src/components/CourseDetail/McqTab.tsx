import { Brain, CheckCircle, Loader2, RefreshCw, Sparkles, XCircle } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import {
    useMcqs,
    useRegenerateMcqs,
    useSeedMcqs,
    useSubmitMcqAttempt
} from '../../hooks/useNotes'
import { TabPanel } from './Shared'
import { DISPLAY_COUNT, SAMPLE_MCQS, pickRandom } from './types'

export function McqTab({ courseId }: { courseId: string }) {
    const { data: mcqs = [], isLoading }       = useMcqs(courseId)
    const { mutate: submitAttempt }            = useSubmitMcqAttempt(courseId)
    const { mutate: seed, isPending: seeding } = useSeedMcqs(courseId)
    const { mutate: regenerate, isPending: regenerating } = useRegenerateMcqs(courseId)

    // Test state
    const [started,  setStarted]  = useState(false)
    const [testIdx,  setTestIdx]  = useState(0)
    const [selected, setSelected] = useState<number | null>(null)
    const [answered, setAnswered] = useState(false)
    const [score,    setScore]    = useState(0)
    const [done,     setDone]     = useState(false)
    const [results,  setResults]  = useState<{ question: string; correct: number; selected: number }[]>([])

    //  replace seed(SAMPLE_MCQS) with AI API call
    useEffect(() => {
    if (!isLoading && mcqs.length === 0) {
        seed(pickRandom(SAMPLE_MCQS, DISPLAY_COUNT))
    }
    }, [isLoading])
    
    const resetTest = () => {
        setStarted(false); setTestIdx(0); setSelected(null)
        setAnswered(false); setScore(0); setDone(false); setResults([])
    }

    const handleAnswer = (idx: number) => {
        if (answered) return
        setSelected(idx)
        setAnswered(true)

        const mcq       = mcqs[testIdx]
        const chosen    = mcq.options[idx]
        if (!chosen) return

        const correctIndex = mcq.options.findIndex((option) => option.isCorrect)
        const isCorrect = chosen.isCorrect
        if (isCorrect) setScore((s) => s + 1)

        setResults((r) => [...r, { question: mcq.question, correct: correctIndex, selected: idx }])
        submitAttempt({ mcqId: mcq.id, selectedOptionId: chosen.id })
    }

    const handleNext = () => {
        if (testIdx + 1 >= mcqs.length) {
            setDone(true)
        } else {
            setTestIdx((i) => i + 1)
            setSelected(null)
            setAnswered(false)
        }
    }

    // ── Loading / seeding ──
    if (isLoading || seeding) {
        return (
            <TabPanel>
                <div className="flex justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-[#667eea]" />
                </div>
            </TabPanel>
        )
    }

    // ── Not started yet ──
    if (!started) {
    return (
        <TabPanel>
            <div className="flex flex-col items-center py-12 gap-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center shadow-lg shadow-purple-200">
                    <Brain className="w-10 h-10 text-white" />
                </div>
                <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready to Test Your Knowledge?</h3>
                    <p className="text-gray-500">{mcqs.length} question{mcqs.length !== 1 ? 's' : ''} • Answer all and see your score</p>
                </div>
                <Button onClick={() => setStarted(true)}>
                    Start MCQ Test
                </Button>
            </div>
        </TabPanel>
    )
}
    // ── Test done — score screen ──
    if (done) {
        const percentage = Math.round((score / mcqs.length) * 100)

        return (
            <TabPanel>
                <div className="max-w-xl mx-auto py-4 space-y-6">
                    {/* Score summary */}
                    <div className="text-center">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-200">
                            <span className="text-2xl font-bold text-white">{percentage}%</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">Test Complete!</h3>
                        <p className="text-gray-500">
                            You got <span className="font-bold text-[#667eea]">{score}</span> out of <span className="font-bold">{mcqs.length}</span> correct
                        </p>
                    </div>

                    {/* Per-question breakdown */}
                    <div className="space-y-3">
                        {results.map((r, i) => {
                            const isCorrect = r.selected === r.correct
                            const mcq       = mcqs[i]
                            return (
                                <div
                                    key={i}
                                    className={`p-4 rounded-xl border ${
                                        isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                            isCorrect ? 'bg-green-500' : 'bg-red-500'
                                        }`}>
                                            {isCorrect
                                                ? <CheckCircle className="w-4 h-4 text-white" />
                                                : <XCircle    className="w-4 h-4 text-white" />
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 mb-2 text-sm">{r.question}</p>
                                            {!isCorrect && (
                                                <div className="space-y-1">
                                                    <p className="text-xs text-red-600">
                                                        Your answer: <span className="font-semibold">{mcq.options[r.selected]?.optionText ?? 'N/A'}</span>
                                                    </p>
                                                    <p className="text-xs text-green-600">
                                                        Correct answer: <span className="font-semibold">{mcq.options[r.correct]?.optionText ?? 'N/A'}</span>
                                                    </p>
                                                </div>
                                            )}
                                            {isCorrect && (
                                                <p className="text-xs text-green-600 font-medium">{mcq.options[r.correct]?.optionText ?? 'Correct'}</p>
                                            )}
                                            {mcq.explanation && (
                                                <p className="text-xs text-gray-500 mt-1 italic">{mcq.explanation}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            fullWidth
                            onClick={resetTest}
                            icon={<RefreshCw className="w-4 h-4" />}
                        >
                            Retry Test
                        </Button>
                        <Button
                            fullWidth
                            onClick={() => { regenerate(pickRandom(SAMPLE_MCQS, DISPLAY_COUNT)); resetTest() }}
                            disabled={regenerating}
                            icon={<Sparkles className="w-4 h-4" />}
                        >
                            {regenerating ? 'Regenerating...' : 'Regenerate Questions'}
                        </Button>
                    </div>
                </div>
            </TabPanel>
        )
    }

    // ── Active question ──
    const mcq = mcqs[testIdx]

    return (
        <TabPanel>
            <div className="max-w-xl mx-auto space-y-6">
                {/* Progress bar */}
                <div className="flex items-center gap-3">
                    <p className="text-sm text-gray-500 flex-shrink-0">
                        {testIdx + 1} / {mcqs.length}
                    </p>
                    <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${(testIdx / mcqs.length) * 100}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                </div>

                {/* Question */}
                <p className="text-lg font-semibold text-gray-900 leading-relaxed">{mcq.question}</p>

                {/* Options */}
                <div className="space-y-3">
                    {mcq.options.map((opt, i) => {
                        let cls = 'border border-gray-200 text-gray-700 hover:border-[#667eea]/50 hover:bg-purple-50 cursor-pointer'

                        if (answered) {
                            if (opt.isCorrect)            cls = 'border-green-400 bg-green-50 text-green-800 cursor-default'
                            else if (i === selected)       cls = 'border-red-400 bg-red-50 text-red-800 cursor-default'
                            else                           cls = 'border-gray-100 text-gray-400 cursor-default'
                        }

                        return (
                            <motion.button
                                key={i}
                                whileHover={answered ? {} : { scale: 1.01 }}
                                whileTap={answered ? {} : { scale: 0.99 }}
                                onClick={() => handleAnswer(i)}
                                disabled={answered}
                                className={`w-full text-left px-5 py-4 rounded-xl border transition-all text-sm font-medium ${cls}`}
                            >
                                <span className="font-bold mr-3 text-xs opacity-60">{String.fromCharCode(65 + i)}</span>
                                {opt.optionText}
                            </motion.button>
                        )
                    })}
                </div>

                {/* Explanation + Next button */}
                <AnimatePresence>
                    {answered && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-3"
                        >
                            {mcq.explanation && (
                                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-sm text-blue-800">
                                    <span className="font-semibold">Explanation: </span>{mcq.explanation}
                                </div>
                            )}
                            <Button fullWidth onClick={handleNext}>
                                {testIdx + 1 >= mcqs.length ? 'See Results' : 'Next Question →'}
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </TabPanel>
    )
}
