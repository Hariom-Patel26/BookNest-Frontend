import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authService, getErrorMessage } from '../services'

const AuthContext = createContext(null)

const STORAGE_KEYS = { TOKEN: 'token', USER: 'user' }

/**
 * Single source of truth for authentication.
 *
 * Security notes:
 * - Role is *never* writable from the client. `register()` strips any `role`
 *   field on payload, and the server is expected to default new users to CUSTOMER.
 * - JWT is stored in localStorage. The role we read is the one decoded by the
 *   server into the user object — we trust it for UI gating, but the gateway/JWT
 *   filter does the real authorization on each protected request.
 */
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(null)
  const [loading, setLoading] = useState(true)

  // ─── Rehydrate from localStorage on mount ────────────────────────────────
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem(STORAGE_KEYS.TOKEN)
      const savedUser  = localStorage.getItem(STORAGE_KEYS.USER)
      if (savedToken && savedUser) {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
      }
    } catch (e) {
      // Corrupted storage — clear it
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER)
    } finally {
      setLoading(false)
    }
  }, [])

  const persist = useCallback((newToken, newUser) => {
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem(STORAGE_KEYS.TOKEN, newToken)
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser))
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await authService.login({ email, password })
    const { accessToken, user: userData } = res.data
    if (!accessToken || !userData) {
      throw new Error('Malformed login response from server')
    }
    persist(accessToken, userData)
    return userData
  }, [persist])

  const register = useCallback(async (data) => {
    // Defense-in-depth: never let a `role` field reach the API from public signup.
    const { role, ...safe } = data
    const res = await authService.register(safe)
    const { accessToken, user: userData } = res.data
    if (!accessToken || !userData) {
      throw new Error('Malformed register response from server')
    }
    persist(accessToken, userData)
    return userData
  }, [persist])

  const logout = useCallback(() => {
    // Best-effort server logout — never block the UI on it.
    if (token) authService.logout(token).catch(() => {})
    setToken(null)
    setUser(null)
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER)
  }, [token])

  const updateUser = useCallback((updated) => {
    setUser(updated)
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated))
  }, [])

  /**
   * Used by the OAuth2 callback page. The auth-service has already verified
   * the user with Google and issued our JWT — we just need to fetch the user
   * profile and persist both.
   */
  const loginWithToken = useCallback(async (newToken, userId) => {
    if (!newToken || !userId) {
      throw new Error('OAuth callback missing token or userId')
    }
    // Stash the token first so the apiClient interceptor attaches it to the
    // profile fetch.
    localStorage.setItem(STORAGE_KEYS.TOKEN, newToken)
    setToken(newToken)
    const res = await authService.getProfile(userId)
    persist(newToken, res.data)
    return res.data
  }, [persist])

  /**
   * Sign the user in directly from a server-issued AuthResponse — used by the
   * reset-password flow so the user doesn't have to retype the password they
   * just set. The shape matches /auth/login: { accessToken, user, ... }.
   */
  const loginWithAuthResponse = useCallback((authResponse) => {
    const { accessToken, user: userData } = authResponse ?? {}
    if (!accessToken || !userData) {
      throw new Error('Malformed auth response from server')
    }
    persist(accessToken, userData)
    return userData
  }, [persist])

  const value = useMemo(() => {
    const isLoggedIn = !!token
    const isAdmin    = user?.role === 'ADMIN'
    return {
      user, token, loading,
      isLoggedIn, isAdmin,
      login, register, logout, updateUser, loginWithToken, loginWithAuthResponse,
      /** Where to send the user after login — admins land in /admin. */
      postLoginPath: (fallback = '/') => (isAdmin ? '/admin' : fallback)
    }
  }, [user, token, loading, login, register, logout, updateUser, loginWithToken, loginWithAuthResponse])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

export { getErrorMessage }
