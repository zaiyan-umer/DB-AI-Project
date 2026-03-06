import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '../src/components/ProtectedRoute'
import Signup from './pages/Signup'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ForgotPassword from './pages/ForgotPassword'

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
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
])

const App = () => {
  return <RouterProvider router={router} />
}

export default App