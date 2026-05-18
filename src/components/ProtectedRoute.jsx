import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PageLoader } from './ui/index.jsx'

/**
 * Wraps any route that requires authentication.
 * Preserves the attempted URL so the user lands back where they tried to go.
 */
export function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth()
  const location = useLocation()

  if (loading) return <PageLoader />
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}

/**
 * Admin-only gate. Non-admins (logged in or not) are bounced.
 * - Anonymous   → /login
 * - Customer    → / (home, with toast handled at the page level if desired)
 */
export function AdminRoute({ children }) {
  const { isLoggedIn, isAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading) return <PageLoader />
  if (!isLoggedIn) return <Navigate to="/login" state={{ from: location }} replace />
  if (!isAdmin)    return <Navigate to="/" replace />
  return children
}
