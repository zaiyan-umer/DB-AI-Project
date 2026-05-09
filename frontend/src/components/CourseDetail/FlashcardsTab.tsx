import { Brain, CheckCircle, FileText, Loader2, RefreshCw, RotateCcw, Sparkles, XCircle } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { Button } from '../../components/Button'
import {
    useFinishFlashcardSession,
    useFlashcards,
    useFiles,
    useProcessFilesForFlashcards,
    useRegenerateFlashcards,
    useStartFlashcardSession,
} from '../../hooks/useNotes'
import { TabPanel } from './Shared'

type ViewState = 'idle' | 'study' | 'done'

export function FlashcardsTab({ courseId }: { courseId: string }) {
    const { data: files = [] } = useFiles(courseId)

    const {
        data: cards = [],
        isLoading,
    } = useFlashcards(courseId)

    const {
        mutate: processFiles,
        isPending: processing,
    } = useProcessFilesForFlashcards(courseId)

    const {
        mutate: regenerate,
        isPending: regenerating,
    } = useRegenerateFlashcards(courseId)

    const { mutate: startSession } = useStartFlashcardSession(courseId)

    const { mutate: finishSession } = useFinishFlashcardSession()

    const hasFiles = files.length > 0
    const hasCards = cards.length > 0

    // Track file count at last successful processFiles to detect deletions
    const [lastProcessedFileCount, setLastProcessedFileCount] = useState(() => hasCards ? files.length : -1)

    // Dirty when: a file was added after last generation, OR file count changed since last process
    const newestFileAt  = files.length ? Math.max(...files.map(f => new Date(f.createdAt).getTime())) : 0
    const newestCardAt  = cards.length ? Math.max(...cards.map(c => new Date(c.updatedAt).getTime())) : 0
    const hasNewerFiles = hasFiles && hasCards && (newestFileAt > newestCardAt || files.length !== lastProcessedFileCount)

    const [view, setView] = useState<ViewState>('idle')
    const [sessionId, setSessionId] = useState<string | null>(null)

    const [familiar, setFamiliar] = useState(0)
    const [unfamiliar, setUnfamiliar] = useState(0)

    const [currentIdx, setCurrentIdx] = useState(0)
    const [flipped, setFlipped] = useState(false)

    const handleProcessFiles = () => {
        processFiles(undefined, {
            onSuccess: () => {
                setLastProcessedFileCount(files.length)
                setView('idle')
            },
        })
    }

    const handleStart = () => {
        startSession(undefined, {
            onSuccess: (session) => {
                setSessionId(session.id)

                setFamiliar(0)
                setUnfamiliar(0)

                setCurrentIdx(0)
                setFlipped(false)

                setView('study')
            },
        })
    }

    const handleReview = (known: boolean) => {
        if (!sessionId) return

        if (known) {
            setFamiliar((f) => f + 1)
        } else {
            setUnfamiliar((u) => u + 1)
        }

        const isLast = currentIdx + 1 >= cards.length

        if (isLast) {
            const finalFamiliar = familiar + (known ? 1 : 0)
            const finalUnfamiliar = unfamiliar + (known ? 0 : 1)

            finishSession({
                sessionId,
                familiarCount: finalFamiliar,
                unfamiliarCount: finalUnfamiliar,
                totalCards: cards.length,
            })

            setView('done')
        } else {
            setFlipped(false)
            setCurrentIdx((i) => i + 1)
        }
    }

    const handleStudyAgain = () => {
        startSession(undefined, {
            onSuccess: (session) => {
                setSessionId(session.id)

                setFamiliar(0)
                setUnfamiliar(0)

                setCurrentIdx(0)
                setFlipped(false)

                setView('study')
            },
        })
    }

    const handleRegenerate = () => {
        regenerate(undefined, {
            onSuccess: () => setView('idle'),
        })
    }

    if (isLoading || processing || regenerating) {
        return (
            <TabPanel>
                <div className="flex flex-col items-center gap-4 py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-[#667eea]" />

                    {(processing || regenerating) && (
                        <p className="text-sm text-gray-500">
                            {processing
                                ? 'Generating flashcards from your files…'
                                : 'Regenerating flashcards…'}
                        </p>
                    )}
                </div>
            </TabPanel>
        )
    }

    if (view === 'idle') {
        return (
            <TabPanel>
                <div className="flex flex-col items-center py-12 gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center shadow-lg shadow-purple-200">
                        <Brain className="w-10 h-10 text-white" />
                    </div>

                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {hasCards && !hasNewerFiles
                                ? 'Ready to Study?'
                                : 'Generate Flashcards'}
                        </h3>

                        <p className="text-gray-500">
                            {hasCards && !hasNewerFiles
                                ? `${cards.length} flashcard${cards.length !== 1 ? 's' : ''} ready • Flip each card and rate yourself`
                                : hasNewerFiles
                                  ? 'New files detected — process them to regenerate your flashcards'
                                  : hasFiles
                                    ? 'Process your uploaded files to generate AI flashcards'
                                    : 'Upload files in the Files tab first, then process them here'}
                        </p>
                    </div>

                    {!hasFiles && !hasCards && (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 text-sm">
                            <FileText className="w-4 h-4 flex-shrink-0" />

                            No files uploaded yet. Go to the Files tab to
                            upload PDFs or Word docs.
                        </div>
                    )}

                    <div className="flex flex-col items-center gap-3 w-full max-w-xs">
                        {(!hasCards || hasNewerFiles) && (
                            <Button
                                fullWidth
                                disabled={!hasFiles}
                                onClick={handleProcessFiles}
                                icon={<Sparkles className="w-4 h-4" />}
                            >
                                Process Files
                            </Button>
                        )}

                        {hasCards && !hasNewerFiles && (
                            <Button fullWidth onClick={handleStart}>
                                Start Studying
                            </Button>
                        )}
                    </div>
                </div>
            </TabPanel>
        )
    }

    if (view === 'done') {
        const pct = Math.round((familiar / cards.length) * 100)

        return (
            <TabPanel>
                <div className="flex flex-col items-center gap-6 py-8 max-w-sm mx-auto">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center shadow-lg shadow-purple-200">
                        <span className="text-2xl font-bold text-white">
                            {pct}%
                        </span>
                    </div>

                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">
                            Session Complete!
                        </h3>

                        <p className="text-gray-500">
                            You reviewed all {cards.length} cards
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <span className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-green-50 text-green-700 text-sm font-medium">
                            <CheckCircle className="w-4 h-4" />
                            {familiar} Familiar
                        </span>

                        <span className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-50 text-red-700 text-sm font-medium">
                            <XCircle className="w-4 h-4" />
                            {unfamiliar} Unfamiliar
                        </span>
                    </div>

                    <div className="flex flex-col items-center gap-3 w-full">
                        <Button
                            fullWidth
                            disabled={!hasCards}
                            onClick={handleStudyAgain}
                            icon={<RotateCcw className="w-4 h-4" />}
                        >
                            Study Again
                        </Button>

                        <button
                            onClick={handleRegenerate}
                            disabled={!hasFiles || regenerating}
                            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-colors
                                disabled:opacity-40 disabled:cursor-not-allowed
                                text-gray-500 hover:text-[#667eea] hover:bg-purple-50 disabled:hover:text-gray-500 disabled:hover:bg-transparent"
                        >
                            <RefreshCw
                                className={`w-4 h-4 ${
                                    regenerating ? 'animate-spin' : ''
                                }`}
                            />

                            {regenerating
                                ? 'Regenerating…'
                                : 'Regenerate Cards'}
                        </button>

                        <button
                            onClick={() => setView('idle')}
                            disabled={!hasFiles}
                            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-colors
                                disabled:opacity-40 disabled:cursor-not-allowed
                                text-gray-500 hover:text-gray-800 hover:bg-gray-100 disabled:hover:text-gray-500 disabled:hover:bg-transparent"
                        >
                            <FileText className="w-4 h-4" />

                            Process Files
                        </button>
                    </div>
                </div>
            </TabPanel>
        )
    }

    const card = cards[currentIdx]

    const remaining = cards.length - (familiar + unfamiliar)

    return (
        <TabPanel>
            <div className="flex flex-col items-center gap-6 py-4">
                <div className="flex items-center justify-between w-full max-w-lg">
                    <div className="flex gap-2">
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-medium">
                            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                            {unfamiliar} Unfamiliar
                        </span>

                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-600 text-xs font-medium">
                            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                            {familiar} Familiar
                        </span>
                    </div>

                    <span className="text-sm text-gray-400 font-medium">
                        {remaining} remaining
                    </span>
                </div>

                <div
                    className="w-full max-w-lg cursor-pointer select-none"
                    style={{ perspective: 1200 }}
                    onClick={() => setFlipped((f) => !f)}
                >
                    <motion.div
                        animate={{ rotateY: flipped ? 180 : 0 }}
                        transition={{
                            duration: 0.45,
                            ease: 'easeInOut',
                        }}
                        style={{
                            transformStyle: 'preserve-3d',
                            position: 'relative',
                            height: 240,
                        }}
                    >
                        <div
                            className="absolute inset-0 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-2xl flex flex-col items-center justify-center p-8 text-white shadow-lg shadow-purple-200"
                            style={{ backfaceVisibility: 'hidden' }}
                        >
                            <p className="text-xs uppercase tracking-widest mb-4 opacity-60 font-medium">
                                Question
                            </p>

                            <p className="text-lg font-semibold text-center leading-relaxed">
                                {card?.question}
                            </p>

                            <p className="text-xs mt-6 opacity-40">
                                Click card to reveal answer
                            </p>
                        </div>

                        <div
                            className="absolute inset-0 bg-white rounded-2xl border-2 border-[#667eea]/20 flex flex-col items-center justify-center p-8 shadow-lg"
                            style={{
                                backfaceVisibility: 'hidden',
                                transform: 'rotateY(180deg)',
                            }}
                        >
                            <p className="text-xs uppercase tracking-widest mb-4 text-[#667eea] opacity-60 font-medium">
                                Answer
                            </p>

                            <p className="text-lg font-semibold text-center text-gray-900 leading-relaxed">
                                {card?.answer}
                            </p>

                            <p className="text-xs mt-6 text-gray-300">
                                Click to flip back
                            </p>
                        </div>
                    </motion.div>
                </div>

                <div className="flex gap-3 w-full max-w-lg">
                    <button
                        onClick={() => handleReview(false)}
                        disabled={!flipped}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border-2 font-semibold transition-colors
                            ${
                                flipped
                                    ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer'
                                    : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                            }`}
                    >
                        <XCircle className="w-5 h-5" />
                        I didn't know it
                    </button>

                    <button
                        onClick={() => handleReview(true)}
                        disabled={!flipped}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border-2 font-semibold transition-colors
                            ${
                                flipped
                                    ? 'border-green-200 bg-green-50 text-green-600 hover:bg-green-100 cursor-pointer'
                                    : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                            }`}
                    >
                        <CheckCircle className="w-5 h-5" />
                        I knew it
                    </button>
                </div>

                {!flipped && (
                    <p className="text-xs text-gray-400">
                        Flip the card first to rate yourself
                    </p>
                )}
            </div>
        </TabPanel>
    )
}