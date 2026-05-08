import { Brain, CheckCircle, Loader2, RefreshCw, RotateCcw, XCircle } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import {
    useFinishFlashcardSession,
    useFlashcards,
    useRegenerateFlashcards,
    useSeedFlashcards,
    useStartFlashcardSession
} from '../../hooks/useNotes'
import { TabPanel } from './Shared'
import { DISPLAY_COUNT, SAMPLE_FLASHCARDS, pickRandom } from './types'

export function FlashcardsTab({ courseId }: { courseId: string }) {
    const { data: cards = [], isLoading }                  = useFlashcards(courseId)
    const { mutate: seed,       isPending: seeding }       = useSeedFlashcards(courseId)
    const { mutate: regenerate, isPending: regenerating }  = useRegenerateFlashcards(courseId)
    const { mutate: startSession }                         = useStartFlashcardSession(courseId)
    const { mutate: finishSession }                        = useFinishFlashcardSession()
 
    // session state
    const [sessionId,   setSessionId]   = useState<string | null>(null)
    const [sessionDone, setSessionDone] = useState(false)
    const [familiar,    setFamiliar]    = useState(0)
    const [unfamiliar,  setUnfamiliar]  = useState(0)
    const [currentIdx,  setCurrentIdx]  = useState(0)
    const [flipped,     setFlipped]     = useState(false)
 
    const remaining = cards.length - (familiar + unfamiliar)
 
    // seed on first load if DB is empty — replace with AI call later
    useEffect(() => {
    if (!isLoading && cards.length === 0) {
        seed(pickRandom(SAMPLE_FLASHCARDS, DISPLAY_COUNT))
    }
    }, [isLoading])

    // reset local session state when cards reload (e.g. after regenerate)
    useEffect(() => {
        setSessionId(null); setSessionDone(false)
        setFamiliar(0);     setUnfamiliar(0)
        setCurrentIdx(0);   setFlipped(false)
    }, [cards])
 
    // ── Start a new session ──
    const handleStart = () => {
        startSession(undefined, {
            onSuccess: (session) => setSessionId(session.id),
        })
    }
 
    // ── Button press — save review + advance ──
    const handleReview = (known: boolean) => {
        if (!sessionId) return
 
        known ? setFamiliar(f => f + 1) : setUnfamiliar(u => u + 1)
 
        const isLast = currentIdx + 1 >= cards.length
        if (isLast) {
            // write final counts to the session row
            const finalFamiliar   = familiar   + (known ? 1 : 0)
            const finalUnfamiliar = unfamiliar + (known ? 0 : 1)
            finishSession({
                sessionId,
                familiarCount:   finalFamiliar,
                unfamiliarCount: finalUnfamiliar,
                totalCards:      cards.length,
            })
            setSessionDone(true)
        } else {
            setFlipped(false)
            setCurrentIdx(i => i + 1)
        }
    }
 
    // ── Study Again : new session, same cards ──
    const handleStudyAgain = () => {
        setSessionDone(false); setFamiliar(0)
        setUnfamiliar(0);      setCurrentIdx(0); setFlipped(false)
        startSession(undefined, {
            onSuccess: (session) => setSessionId(session.id),
        })
    }
 
    // ── Regenerate : new content ──
    const handleRegenerate = () => regenerate(pickRandom(SAMPLE_FLASHCARDS, DISPLAY_COUNT))
 
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
 
    // ── Pre-session — user hasn't started yet ──
    if (!sessionId && !sessionDone) {
        return (
            <TabPanel>
                <div className="flex flex-col items-center py-12 gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center shadow-lg shadow-purple-200">
                        <Brain className="w-10 h-10 text-white" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready to Study?</h3>
                        <p className="text-gray-500">{cards.length} flashcard{cards.length !== 1 ? 's' : ''} • Flip each card and rate yourself</p>
                    </div>
                    <Button onClick={handleStart}>Start Studying</Button>
                </div>
            </TabPanel>
        )
    }
    // ── Session complete — results screen ──
    if (sessionDone) {
        const pct = Math.round((familiar / cards.length) * 100)
        return (
            <TabPanel>
                <div className="flex flex-col items-center gap-6 py-8 max-w-sm mx-auto">
                    {/* Score ring */}
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center shadow-lg shadow-purple-200">
                        <span className="text-2xl font-bold text-white">{pct}%</span>
                    </div>
                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">Session Complete!</h3>
                        <p className="text-gray-500">You reviewed all {cards.length} cards</p>
                    </div>
 
                    {/* Familiar / Unfamiliar pills */}
                    <div className="flex gap-3">
                        <span className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-green-50 text-green-700 text-sm font-medium">
                            <CheckCircle className="w-4 h-4" /> {familiar} Familiar
                        </span>
                        <span className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-50 text-red-700 text-sm font-medium">
                            <XCircle className="w-4 h-4" /> {unfamiliar} Unfamiliar
                        </span>
                    </div>
 
                    {/* Action buttons */}
                    <div className="flex flex-col items-center gap-3 w-full">
                        <Button fullWidth onClick={handleStudyAgain} icon={<RotateCcw className="w-4 h-4" />}>
                            Study Again
                        </Button>
                        <button
                            onClick={handleRegenerate}
                            disabled={regenerating}
                            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#667eea] transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
                            {regenerating ? 'Regenerating...' : 'Regenerate Cards'}
                        </button>
                    </div>
                </div>
            </TabPanel>
        )
    }
 
    // ── Active session — card + buttons ──
    const card = cards[currentIdx]
 
    return (
        <TabPanel>
            <div className="flex flex-col items-center gap-6 py-4">
 
                {/* Top row — Unfamiliar / Familiar + remaining */}
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
                    <span className="text-sm text-gray-400 font-medium">{remaining} remaining</span>
                </div>
 
                {/* Flip card */}
                <div
                    className="w-full max-w-lg cursor-pointer select-none"
                    style={{ perspective: 1200 }}
                    onClick={() => setFlipped(f => !f)}
                >
                    <motion.div
                        animate={{ rotateY: flipped ? 180 : 0 }}
                        transition={{ duration: 0.45, ease: 'easeInOut' }}
                        style={{ transformStyle: 'preserve-3d', position: 'relative', height: 240 }}
                    >
                        {/* Front — Question */}
                        <div
                            className="absolute inset-0 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-2xl
                                       flex flex-col items-center justify-center p-8 text-white shadow-lg shadow-purple-200"
                            style={{ backfaceVisibility: 'hidden' }}
                        >
                            <p className="text-xs uppercase tracking-widest mb-4 opacity-60 font-medium">Question</p>
                            <p className="text-lg font-semibold text-center leading-relaxed">{card?.question}</p>
                            <p className="text-xs mt-6 opacity-40">Click card to reveal answer</p>
                        </div>
                        {/* Back — Answer */}
                        <div
                            className="absolute inset-0 bg-white rounded-2xl border-2 border-[#667eea]/20
                                       flex flex-col items-center justify-center p-8 shadow-lg"
                            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                        >
                            <p className="text-xs uppercase tracking-widest mb-4 text-[#667eea] opacity-60 font-medium">Answer</p>
                            <p className="text-lg font-semibold text-center text-gray-900 leading-relaxed">{card?.answer}</p>
                            <p className="text-xs mt-6 text-gray-300">Click to flip back</p>
                        </div>
                    </motion.div>
                </div>
 
                {/* I knew it / I didn't know it — only active after flip */}
                <div className="flex gap-3 w-full max-w-lg">
                    <button
                        onClick={() => handleReview(false)}
                        disabled={!flipped}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border-2 font-semibold transition-colors
                            ${flipped
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
                            ${flipped
                                ? 'border-green-200 bg-green-50 text-green-600 hover:bg-green-100 cursor-pointer'
                                : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                            }`}
                    >
                        <CheckCircle className="w-5 h-5" />
                        I knew it
                    </button>
                </div>
 
                {!flipped && (
                    <p className="text-xs text-gray-400">Flip the card first to rate yourself</p>
                )}
 
            </div>
        </TabPanel>
    )
}
