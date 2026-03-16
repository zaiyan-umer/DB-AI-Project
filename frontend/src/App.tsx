import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { DashboardLayout } from '@/components/DashboardLayout'
import Signup from './pages/auth/Signup'
import Login from './pages/auth/Login'
import ForgotPassword from './pages/auth/ForgotPassword'
import ChangePassword from './pages/auth/ChangePassword'
import Dashboard from './pages/Dashboard'
import SchedulerPage from './pages/Scheduler'
import NotesTestPage from './pages/NotesTest'
import CourseDetailPage from './pages/CourseDetail'
import { ChatPage } from './pages/ChatPage'


// Placeholder pages for routes not yet built
const PlaceholderPage = ({ name }: { name: string }) => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-400 mb-2">{name}</h2>
      <p className="text-gray-400">Coming soon...</p>
    </div>
  </div>
)

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" />,
  },
  {
    path: '/signup',
    element: <Signup />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
  },
  {
    path: '/verify-email',
    element: <ChangePassword />,
  },

  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'scheduler', element: <SchedulerPage /> },
      { path: 'notes', element: <NotesTestPage /> },
      { path: 'notes/:courseId', element: <CourseDetailPage /> },
      { path: 'notes', element: <PlaceholderPage name="Notes & Test" /> },
      { path: 'group-chat', element: <ChatPage /> },
      { path: 'progress', element: <PlaceholderPage name="Progress" /> },
    ],
  },
])

const App = () => {
  return <RouterProvider router={router} />
}

export default App