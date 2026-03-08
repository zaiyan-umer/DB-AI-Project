import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Signup from './pages/auth/Signup'
import Login from './pages/auth/Login'
import Dashboard from './pages/Dashboard'
import ForgotPassword from './pages/auth/ForgotPassword'
import ChangePassword from './pages/auth/ChangePassword'
import Chat from './pages/Chat'
import { GroupChatPage } from './pages/GroupChat'

// Create router with proper route definitions
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
    element: <ChangePassword />
  },

  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  
  {
    path: '/chat',
    element: (
      <ProtectedRoute>
        <Chat />
      </ProtectedRoute>
    ),
  },

  {
    path: '/groupchat',
    element: (
      <ProtectedRoute>
        <GroupChatPage />
      </ProtectedRoute>
    ),
  },
])

const App = () => {
  return <RouterProvider router={router} />
}

export default App