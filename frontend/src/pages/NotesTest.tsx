import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/Card'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Plus, BookOpen, FileText, Brain, CheckCircle, Trash2 } from 'lucide-react'
import { motion } from 'motion/react'
import { useCourses, useCreateCourse, useDeleteCourse } from '../hooks/useNotes'

const COLOR_STYLES: Record<string, { background: string }> = {
    'from-blue-500 to-cyan-500':       { background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' },
    'from-purple-500 to-pink-500':     { background: 'linear-gradient(135deg, #a855f7, #ec4899)' },
    'from-orange-500 to-red-500':      { background: 'linear-gradient(135deg, #f97316, #ef4444)' },
    'from-green-500 to-emerald-500':   { background: 'linear-gradient(135deg, #22c55e, #10b981)' },
    'from-indigo-500 to-purple-500':   { background: 'linear-gradient(135deg, #6366f1, #a855f7)' },
    'from-yellow-500 to-orange-500':   { background: 'linear-gradient(135deg, #eab308, #f97316)' },
    'from-teal-500 to-cyan-500':       { background: 'linear-gradient(135deg, #14b8a6, #06b6d4)' },
    'from-rose-500 to-pink-500':       { background: 'linear-gradient(135deg, #f43f5e, #ec4899)' },
}

const getColorStyle = (color: string) =>
    COLOR_STYLES[color] ?? { background: 'linear-gradient(135deg, #6366f1, #a855f7)' }

// ---------------------------------------------------------------------------

export default function NotesTestPage() {
    const navigate = useNavigate()

    const { data: courses = [], isLoading } = useCourses()
    const { mutate: createCourse, isPending: creating } = useCreateCourse()
    const { mutate: deleteCourse } = useDeleteCourse()

    const [showAddModal, setShowAddModal]   = useState(false)
    const [newCourseName, setNewCourseName] = useState('')

    const handleAddCourse = () => {
        if (!newCourseName.trim()) return
        createCourse(
            { name: newCourseName.trim() },
            {
                onSuccess: () => {
                    setNewCourseName('')
                    setShowAddModal(false)
                },
            }
        )
    }

    const handleCourseClick = (courseId: string) => {
        navigate(`/dashboard/notes/${courseId}`)
    }

    const handleDeleteCourse = (e: React.MouseEvent, courseId: string) => {
        e.stopPropagation()
        deleteCourse(courseId)
    }

    return (
        <>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Notes & Test</h1>
                        <p className="text-gray-600">Manage your course materials and practice tests</p>
                    </div>
                    <Button onClick={() => setShowAddModal(true)} icon={<Plus className="w-5 h-5" />}>
                        Add Course
                    </Button>
                </div>

                {/* Skeleton while loading */}
                {isLoading && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                                <div className="h-32 bg-indigo-50 rounded-xl mb-4" />
                                <div className="h-5 bg-gray-200 rounded w-2/3 mb-4" />
                                <div className="space-y-3">
                                    {[1, 2, 3].map((j) => <div key={j} className="h-4 bg-gray-100 rounded" />)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Courses Grid */}
                {!isLoading && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {courses.map((course, index) => (
                            <motion.div
                                key={course.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="relative group"
                            >
                                
                            <button
                                onClick={(e) => handleDeleteCourse(e, course.id)}
                                title="Delete"
                                className="absolute top-8 right-8 z-10 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600"
                                >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                                <Card hoverable onClick={() => handleCourseClick(course.id)}>
                                    {/* Colored gradient box — using inline style to bypass Tailwind purge */}
                                    <div
                                        className="h-32 rounded-xl mb-4 flex items-center justify-center"
                                        style={getColorStyle(course.color)}
                                    >
                                        <BookOpen className="w-16 h-16 text-white opacity-80" />
                                    </div>

                                    <h3 className="text-xl font-semibold text-gray-900 mb-4">{course.name}</h3>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <FileText className="w-4 h-4" />
                                                <span>Files</span>
                                            </div>
                                            <span className="font-semibold text-gray-900">{course.filesCount}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Brain className="w-4 h-4" />
                                                <span>Flashcards</span>
                                            </div>
                                            <span className="font-semibold text-gray-900">{course.flashcardsCount}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <CheckCircle className="w-4 h-4" />
                                                <span>MCQs</span>
                                            </div>
                                            <span className="font-semibold text-gray-900">{course.mcqsCount}</span>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}

                        {/* Add Course Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: courses.length * 0.1 }}
                        >
                            <Card
                                hoverable
                                onClick={() => setShowAddModal(true)}
                                className="border-2 border-dashed border-gray-300 flex items-center justify-center min-h-[323px] cursor-pointer hover:border-[#667eea] hover:bg-indigo-50"
                            >
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#667eea]/10">
                                        <Plus className="w-8 h-8 text-[#667eea] opacity-70" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-[#667eea] mb-2">Add New Course</h3>
                                    <p className="text-sm text-gray-400">Create a new course to organize your materials</p>
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                )}
            </div>
            {/* Add Course Modal */}
                <Modal
                    isOpen={showAddModal}
                    onClose={() => { setShowAddModal(false); setNewCourseName('') }}
                    title="Add New Course"
                >
                    <div className="space-y-4">
                        <Input
                            label="Course Name"
                            placeholder="e.g., Data Structures & Algorithms"
                            value={newCourseName}
                            onChange={(e) => setNewCourseName(e.target.value)}
                            required
                        />
                        <div className="flex gap-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => { setShowAddModal(false); setNewCourseName('') }}
                                fullWidth
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddCourse}
                                disabled={creating || !newCourseName.trim()}
                                fullWidth
                            >
                                {creating ? 'Creating...' : 'Create Course'}
                            </Button>
                        </div>
                    </div>
                </Modal>
        </>
    )
}