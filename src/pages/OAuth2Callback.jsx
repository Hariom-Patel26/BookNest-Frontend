import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { Loader } from '../components/ui/index.jsx'

/**
 * Page the auth-service redirects to after a successful OAuth2 sign-in.
 *
 * URL shape:
 *   /oauth2/callback?token=<jwt>&refreshToken=<jwt>&userId=<int>
 *
 * If the auth-service hits an error path it instead redirects to:
 *   /login?error=<code>
 * which the Login page handles — see `pages/Auth.jsx`.
 */
export default function OAuth2Callback() {
  const [params]    = useSearchParams()
  const navigate    = useNavigate()
  const { loginWithToken, postLoginPath } = useAuth()
  const ranOnce     = useRef(false)

  useEffect(() => {
    if (ranOnce.current) return   // StrictMode double-invoke guard
    ranOnce.current = true

    const token  = params.get('token')
    const userId = params.get('userId')
    const error  = params.get('error')

    if (error) {
      toast.error(`Sign-in failed: ${error.replace(/_/g, ' ')}`)
      navigate('/login', { replace: true })
      return
    }

    if (!token || !userId) {
      toast.error('Sign-in callback was malformed')
      navigate('/login', { replace: true })
      return
    }

    loginWithToken(token, userId)
      .then((user) => {
        toast.success(`Welcome, ${user.fullName?.split(' ')[0] ?? 'reader'}!`)
        // Admin redirect for promoted accounts.
        const isAdmin = user.role === 'ADMIN'
        navigate(isAdmin ? '/admin' : '/', { replace: true })
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('OAuth callback error:', err)
        toast.error('Could not complete sign-in. Please try again.')
        navigate('/login', { replace: true })
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '1rem',
      background: 'var(--cream)'
    }}>
      <Loader size={48} />
      <p className="text-muted">Completing sign-in…</p>
    </div>
  )
}
