import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, Upload, Download, Trash2, RotateCcw, FileText, Loader2, Sparkles, RefreshCw, CheckCircle, XCircle, Brain,} from 'lucide-react'
import { Button } from '../components/Button'
import { useCourses, useFiles, useUploadFile, useDeleteFile, useFlashcards, useSeedFlashcards, useRegenerateFlashcards, useStartFlashcardSession, useFinishFlashcardSession, useMcqs, useSeedMcqs, useRegenerateMcqs, useSubmitMcqAttempt,} from '../hooks/useNotes'
import { getDownloadUrl, type FlashcardSeedItem, type McqSeedItem } from '../services/notes.service'

// ---- Helpers --------------------------------------------------------------

const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 ** 2).toFixed(1)} MB`
}

const formatRelativeDate = (iso: string) => {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
    if (days === 0) return 'Today'
    if (days === 1) return '1 day ago'
    return `${days} days ago`
}

type Tab = 'files' | 'flashcards' | 'mcq'

// ---- Sample Data ----------------------------------------------------------
// Seeded automatically on mount. Will be REPLACED by AI-generated content.

const SAMPLE_FLASHCARDS: FlashcardSeedItem[] = [
    {
        question: 'What does Big-O notation describe?',
        answer:   'Big-O notation describes the upper bound of an algorithm\'s time or space complexity as the input size grows, focusing on the dominant term and ignoring constants.',
    },
    {
        question: 'What is the difference between a stack and a queue?',
        answer:   'A stack follows LIFO — the last element added is the first removed. A queue follows FIFO — the first element added is the first removed.',
    },
    {
        question: 'What is a closure in programming?',
        answer:   'A closure is a function that retains access to variables from its outer scope even after that outer function has finished executing.',
    },
    {
        question: 'What is a binary search tree?',
        answer:   'A BST is a tree where each node\'s left subtree contains only nodes with values less than the node, and the right subtree only nodes with greater values.',
    },
    {
        question: 'What is recursion?',
        answer:   'Recursion is when a function calls itself with a smaller input until it reaches a base case that stops the calls.',
    },
    {
        question: 'What is the difference between a process and a thread?',
        answer:   'A process is an independent program with its own memory space. A thread is a lighter unit within a process that shares memory with other threads.',
    },
]

const SAMPLE_MCQS: McqSeedItem[] = [
    {
        question:      'Which data structure uses LIFO ordering?',
        options:       ['Queue', 'Stack', 'Linked List', 'Binary Tree'],
        correctOption: 1,
        explanation:   'A stack is LIFO — elements are pushed and popped from the same end.',
        difficulty:    'easy',
    },
    {
        question:      'What is the time complexity of binary search?',
        options:       ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'],
        correctOption: 2,
        explanation:   'Binary search halves the search space each step, giving O(log n).',
        difficulty:    'medium',
    },
    {
        question:      'Which is NOT a principle of OOP?',
        options:       ['Encapsulation', 'Polymorphism', 'Compilation', 'Inheritance'],
        correctOption: 2,
        explanation:   'The four OOP principles are Encapsulation, Abstraction, Inheritance, and Polymorphism.',
        difficulty:    'medium',
    },
    {
        question:      'What does DFS stand for?',
        options:       ['Data First Search', 'Depth First Search', 'Direct File System', 'Dynamic Function Stack'],
        correctOption: 1,
        explanation:   'DFS stands for Depth First Search — it explores as far as possible before backtracking.',
        difficulty:    'easy',
    },
    {
        question:      'Which sorting algorithm has O(n log n) average case?',
        options:       ['Bubble Sort', 'Insertion Sort', 'Merge Sort', 'Selection Sort'],
        correctOption: 2,
        explanation:   'Merge sort consistently achieves O(n log n) by dividing and merging.',
        difficulty:    'medium',
    },
    {
        question:      'What is a deadlock?',
        options:       ['A memory leak', 'Two processes waiting on each other indefinitely', 'A crashed thread', 'An infinite loop'],
        correctOption: 1,
        explanation:   'A deadlock occurs when two or more processes are each waiting for the other to release a resource.',
        difficulty:    'hard',
    },
]

// Picks `count` random items from an array without repeating - can be removed after Ai integration
const pickRandom = <T,>(arr: T[], count: number): T[] => {
    const shuffled = [...arr].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
}

const DISPLAY_COUNT = 3

// ---- Page -----------------------------------------------------------------

export default function CourseDetailPage() {
    const { courseId }  = useParams<{ courseId: string }>()
    const navigate      = useNavigate()
    const [activeTab, setActiveTab] = useState<Tab>('files')

    const { data: courses = [] } = useCourses()
    const course = courses.find((c) => c.id === courseId)

    if (!courseId) return null

    return (
        <div className="space-y-6">
            {/* Back + Title */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/dashboard/notes')}
                    className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{course?.name ?? 'Course'}</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Manage course materials and practice</p>
                </div>
            </div>

            {/* Tab Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Tab Bar */}
                <div className="flex border-b border-gray-100 px-6 pt-2 gap-1">
                    {(['files', 'flashcards', 'mcq'] as Tab[]).map((tab) => {
                        const labels: Record<Tab, string> = {
                            files:      'Uploaded Files',
                            flashcards: 'Flashcards',
                            mcq:        'MCQ Test',
                        }
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-3 text-sm font-medium transition-all relative ${
                                    activeTab === tab ? 'text-[#667eea]' : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {labels[tab]}
                                {activeTab === tab && (
                                    <motion.div
                                        layoutId="tab-underline"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-t"
                                    />
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    <AnimatePresence mode="wait">
                        {activeTab === 'files'      && <FilesTab      key="files"      courseId={courseId} />}
                        {activeTab === 'flashcards' && <FlashcardsTab key="flashcards" courseId={courseId} />}
                        {activeTab === 'mcq'        && <McqTab        key="mcq"        courseId={courseId} />}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}

// ---- Shared ---------------------------------------------------------------

function TabPanel({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
        >
            {children}
        </motion.div>
    )
}

function EmptyState({
    icon,
    message,
    hint,
}: {
    icon:    React.ReactNode
    message: string
    hint:    string
}) {
    return (
        <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                {icon}
            </div>
            <p className="font-semibold text-gray-700 mb-1">{message}</p>
            <p className="text-sm text-gray-400">{hint}</p>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════
// FILES TAB
// ═══════════════════════════════════════════════════════════════════════════

function FilesTab({ courseId }: { courseId: string }) {
    const { data: files = [], isLoading }           = useFiles(courseId)
    const { mutate: upload, isPending: uploading }  = useUploadFile(courseId)
    const { mutate: remove }                        = useDeleteFile(courseId)
    const fileInputRef                              = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        upload(file)
        e.target.value = ''
    }

    return (
        <TabPanel>
            <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-gray-500">
                    {isLoading ? 'Loading...' : `${files.length} file${files.length !== 1 ? 's' : ''} uploaded`}
                </p>
                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
                    />
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        icon={uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    >
                        {uploading ? 'Uploading...' : 'Upload Files'}
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
                </div>
            ) : files.length === 0 ? (
                <EmptyState
                    icon={<FileText className="w-8 h-8 text-gray-400" />}
                    message="No files uploaded yet"
                    hint="Upload PDFs, Word docs, or slides to get started"
                />
            ) : (
                <div className="space-y-3">
                    {files.map((file) => (
                        <motion.div
                            key={file.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{file.originalName}</p>
                                <p className="text-xs text-gray-500">{formatBytes(file.sizeBytes)} • {formatRelativeDate(file.createdAt)}</p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <a
                                    href={getDownloadUrl(file.id)}
                                    download={file.originalName}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white transition-colors"
                                    title="Download"
                                >
                                    <Download className="w-4 h-4 text-gray-600" />
                                </a>
                                <button
                                    onClick={() => remove(file.id)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4 text-red-400" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* AI placeholder notice */}
            {files.length > 0 && (
                <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-800">AI Processing — Coming in Iteration 3</p>
                        <p className="text-xs text-gray-500">AI will auto-generate flashcards & MCQs from your uploaded files.</p>
                    </div>
                </div>
            )}
        </TabPanel>
    )
}
 
// ═══════════════════════════════════════════════════════════════════════════
// FLASHCARDS TAB
// ═══════════════════════════════════════════════════════════════════════════
 
function FlashcardsTab({ courseId }: { courseId: string }) {
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
 
// ═══════════════════════════════════════════════════════════════════════════
// MCQ TAB — linear test → score screen
// ═══════════════════════════════════════════════════════════════════════════

function McqTab({ courseId }: { courseId: string }) {
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
        const isCorrect = idx === mcq.correctOption
        if (isCorrect) setScore((s) => s + 1)

        setResults((r) => [...r, { question: mcq.question, correct: mcq.correctOption, selected: idx }])
        submitAttempt({ mcqId: mcq.id, selectedOption: idx })
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
                                                        Your answer: <span className="font-semibold">{mcq.options[r.selected]}</span>
                                                    </p>
                                                    <p className="text-xs text-green-600">
                                                        Correct answer: <span className="font-semibold">{mcq.options[r.correct]}</span>
                                                    </p>
                                                </div>
                                            )}
                                            {isCorrect && (
                                                <p className="text-xs text-green-600 font-medium">{mcq.options[r.correct]}</p>
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
                            if (i === mcq.correctOption)  cls = 'border-green-400 bg-green-50 text-green-800 cursor-default'
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
                                {opt}
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