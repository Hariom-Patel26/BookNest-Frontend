import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiBook, FiEye, FiEyeOff, FiLock, FiMail, FiUser, FiArrowLeft } from 'react-icons/fi'
import { FcGoogle } from 'react-icons/fc'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { authService, getErrorMessage } from '../services'
import './Auth.css'

/**
 * Where the OAuth flow starts. The auth-service hosts the Spring Security
 * filter at /oauth2/authorization/{registrationId} — we open that URL directly
 * (NOT through the gateway), so Google can redirect back to
 * http://localhost:8081/login/oauth2/code/google.
 *
 * Override with VITE_AUTH_BASE_URL in .env if your auth-service is elsewhere.
 */
const AUTH_BASE_URL = import.meta.env.VITE_AUTH_BASE_URL || 'http://localhost:8081'
const GOOGLE_LOGIN_URL = `${AUTH_BASE_URL}/oauth2/authorization/google`

const OAUTH_ERROR_MESSAGES = {
  no_email_from_provider:    'Google did not return an email address. Please grant the email permission and try again.',
  user_provisioning_failed:  'We could not create your account. Please try again or use email sign-in.',
  account_suspended:         'This account is suspended. Please contact support.',
  oauth_internal_error:      'Something went wrong during sign-in. Please try again.',
  user_cancelled:            'Sign-in was cancelled.',
  invalid_state:             'Sign-in session expired. Please try again.',
  invalid_token:             'Sign-in token was invalid. Please try again.',
  oauth_failed:              'Sign-in with Google failed. Please try again.',
  server_error:              'Server error. Please try again.'
}

// ─── Shared brand panel ──────────────────────────────────────────────────────
function AuthBrandPanel({ quote, author }) {
  return (
    <div className="auth-left">
      <div className="auth-brand">
        <FiBook size={28} color="var(--amber)" />
        <span>BookNest</span>
      </div>
      <div className="auth-quote">
        <blockquote>"{quote}"</blockquote>
        <cite>— {author}</cite>
      </div>
      <div className="auth-decoration" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="deco-book" style={{ animationDelay: `${i * 0.3}s` }} />
        ))}
      </div>
    </div>
  )
}

// ─── Login ───────────────────────────────────────────────────────────────────
export function Login() {
  const { login, postLoginPath, loginWithAuthResponse } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const fromPath = location.state?.from?.pathname ?? '/'

  const [form, setForm]       = useState({ email: '', password: '', otp: '', newPassword: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  
  // 'login' | 'forgot' | 'reset'
  const [view, setView] = useState('login')

  // ─── Surface OAuth error redirected from the auth-service ───────────────
  useEffect(() => {
    const err = searchParams.get('error')
    if (err) {
      toast.error(OAUTH_ERROR_MESSAGES[err] || `Sign-in failed (${err})`)
      // Clean the URL so re-renders don't re-toast.
      const next = new URLSearchParams(searchParams)
      next.delete('error')
      next.delete('status')
      setSearchParams(next, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleGoogle = () => {
    // Full-page navigation — Spring Security needs a real browser request,
    // not a fetch/XHR, to set the OAuth session cookie.
    window.location.href = GOOGLE_LOGIN_URL
  }

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (view === 'login') {
        const user = await login(form.email, form.password)
        toast.success(`Welcome back, ${user.fullName?.split(' ')[0] ?? 'reader'}!`)
        navigate(postLoginPath(fromPath), { replace: true })
      } else if (view === 'forgot') {
        if (!form.email) {
          toast.error('Please enter your email')
          setLoading(false)
          return
        }
        await authService.forgotPassword({ email: form.email })
        toast.success('If the email is registered, an OTP has been sent.')
        setView('reset')
      } else if (view === 'reset') {
        if (!form.otp || !form.newPassword) {
          toast.error('Please enter the OTP and a new password')
          setLoading(false)
          return
        }
        if (form.newPassword.length < 6) {
          toast.error('New password must be at least 6 characters')
          setLoading(false)
          return
        }
        const res = await authService.resetPassword({
          email: form.email,
          otp: form.otp,
          newPassword: form.newPassword
        })
        // Backend now returns a full AuthResponse (accessToken + user) so the
        // user is signed in immediately — no need to retype credentials.
        const user = loginWithAuthResponse(res.data)
        toast.success('Password reset! Welcome back.')
        navigate(postLoginPath(fromPath), { replace: true })
        return   // skip the finally's setLoading; navigation unmounts the form
      }
    } catch (err) {
      toast.error(getErrorMessage(err, view === 'login' ? 'Invalid email or password' : 'An error occurred'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <AuthBrandPanel
        quote="A reader lives a thousand lives before he dies. The man who never reads lives only one."
        author="George R.R. Martin"
      />
      <div className="auth-right">
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gray-500)', fontSize: '0.875rem', marginBottom: '1.5rem', textDecoration: 'none', fontWeight: 500 }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--amber)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--gray-500)'}>
            <FiArrowLeft /> Back to Home
          </Link>
          {view === 'login' && (
            <div className="auth-header">
              <h2>Welcome back</h2>
              <p>Sign in to continue your reading journey</p>
            </div>
          )}
          {view === 'forgot' && (
            <div className="auth-header">
              <h2>Reset Password</h2>
              <p>Enter your email to receive an OTP</p>
            </div>
          )}
          {view === 'reset' && (
            <div className="auth-header">
              <h2>Enter OTP</h2>
              <p>Check your email for the 6-digit OTP</p>
            </div>
          )}

          <form onSubmit={submit} className="auth-form" noValidate>
            {(view === 'login' || view === 'forgot') && (
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">Email Address</label>
                <div className="input-icon-wrap">
                  <FiMail className="input-icon" size={16} />
                  <input
                    id="login-email" name="email" type="email"
                    className="form-control"
                    placeholder="you@example.com"
                    value={form.email} onChange={handle}
                    autoComplete="email" required
                    readOnly={view === 'reset'}
                  />
                </div>
              </div>
            )}

            {view === 'login' && (
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className="form-label" htmlFor="login-pw">Password</label>
                  <button type="button" className="auth-switch" style={{ background: 'none', border: 'none', padding: 0, color: 'var(--amber)', cursor: 'pointer', fontSize: '0.875rem' }} onClick={() => setView('forgot')}>Forgot Password?</button>
                </div>
                <div className="input-icon-wrap">
                  <FiLock className="input-icon" size={16} />
                  <input
                    id="login-pw" name="password"
                    type={showPw ? 'text' : 'password'}
                    className="form-control"
                    placeholder="••••••••"
                    value={form.password} onChange={handle}
                    autoComplete="current-password" required
                  />
                  <button
                    type="button" className="pw-toggle"
                    onClick={() => setShowPw((s) => !s)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {view === 'reset' && (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="reset-otp">OTP Code</label>
                  <div className="input-icon-wrap">
                    <FiLock className="input-icon" size={16} />
                    <input
                      id="reset-otp" name="otp" type="text"
                      className="form-control"
                      placeholder="123456"
                      value={form.otp} onChange={handle}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="reset-new-pw">New Password</label>
                  <div className="input-icon-wrap">
                    <FiLock className="input-icon" size={16} />
                    <input
                      id="reset-new-pw" name="newPassword"
                      type={showPw ? 'text' : 'password'}
                      className="form-control"
                      placeholder="••••••••"
                      value={form.newPassword} onChange={handle}
                      required minLength={6}
                    />
                    <button
                      type="button" className="pw-toggle"
                      onClick={() => setShowPw((s) => !s)}
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                    >
                      {showPw ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? 'Please wait…' : (view === 'login' ? 'Sign In' : view === 'forgot' ? 'Send OTP' : 'Reset Password')}
            </button>
            {view !== 'login' && (
               <button type="button" className="btn btn-outline btn-full btn-lg" style={{ marginTop: '1rem' }} onClick={() => setView('login')} disabled={loading}>
                 Back to Login
               </button>
            )}
          </form>

          {view === 'login' && (
            <>
              {/* ─── Social sign-in ─── */}
              <div className="auth-divider"><span>or continue with</span></div>
              <button
                type="button"
                className="btn btn-outline btn-full"
                onClick={handleGoogle}
                style={{ gap: '0.6rem' }}
              >
                <FcGoogle size={20} /> Sign in with Google
              </button>

              <p className="auth-switch">
                Don&apos;t have an account? <Link to="/register">Create one →</Link>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}

// ─── Register ─ NO role selector ─────────────────────────────────────────────
export function Register() {
  const { register } = useAuth()
  const navigate     = useNavigate()

  // NOTE: no `role` field — backend defaults new users to CUSTOMER.
  // Role escalation is performed only by an existing admin in the admin panel.
  const [form, setForm]       = useState({ fullName: '', email: '', password: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (form.fullName.trim().length < 2) {
      toast.error('Please enter your full name')
      return
    }
    setLoading(true)
    try {
      const user = await register(form)
      toast.success(`Welcome to BookNest, ${user.fullName?.split(' ')[0] ?? 'reader'}!`)
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(getErrorMessage(err, 'Registration failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <AuthBrandPanel
        quote="The more that you read, the more things you will know."
        author="Dr. Seuss"
      />
      <div className="auth-right">
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gray-500)', fontSize: '0.875rem', marginBottom: '1.5rem', textDecoration: 'none', fontWeight: 500 }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--amber)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--gray-500)'}>
            <FiArrowLeft /> Back to Home
          </Link>
          <div className="auth-header">
            <h2>Create an account</h2>
            <p>Join thousands of readers on BookNest</p>
          </div>
          <form onSubmit={submit} className="auth-form" noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">Full Name</label>
              <div className="input-icon-wrap">
                <FiUser className="input-icon" size={16} />
                <input
                  id="reg-name" name="fullName" type="text"
                  className="form-control"
                  placeholder="Jane Doe"
                  value={form.fullName} onChange={handle}
                  autoComplete="name" required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Email Address</label>
              <div className="input-icon-wrap">
                <FiMail className="input-icon" size={16} />
                <input
                  id="reg-email" name="email" type="email"
                  className="form-control"
                  placeholder="you@example.com"
                  value={form.email} onChange={handle}
                  autoComplete="email" required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-pw">Password</label>
              <div className="input-icon-wrap">
                <FiLock className="input-icon" size={16} />
                <input
                  id="reg-pw" name="password"
                  type={showPw ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Min. 6 characters"
                  value={form.password} onChange={handle}
                  autoComplete="new-password" required minLength={6}
                />
                <button
                  type="button" className="pw-toggle"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            {/* No role selector. New accounts are always CUSTOMER. */}

            <button type="submit" className="btn btn-amber btn-full btn-lg" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          {/* ─── Social sign-in ─── */}
          <div className="auth-divider"><span>or continue with</span></div>
          <button
            type="button"
            className="btn btn-outline btn-full"
            onClick={() => { window.location.href = GOOGLE_LOGIN_URL }}
            style={{ gap: '0.6rem' }}
          >
            <FcGoogle size={20} /> Sign up with Google
          </button>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in →</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
