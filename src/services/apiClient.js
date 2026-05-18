import axios from 'axios'

/**
 * Axios instance pointed at the API gateway (proxied through Vite in dev).
 * - Attaches the JWT bearer token automatically.
 * - Handles 401 globally by clearing storage and redirecting to /login.
 * - Provides a normalised error message for callers.
 */
const apiClient = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

// ─── Request interceptor: attach JWT ────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (err) => Promise.reject(err)
)

// ─── Response interceptor: global 401 handling + error normalisation ────────
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    // Network / no-response
    if (!err.response) {
      err.normalizedMessage = 'Network error — please check your connection.'
      return Promise.reject(err)
    }

    const { status, data } = err.response

    // Unauthorised — but DON'T forcibly redirect for /auth/login (let the page
    // show its own validation error rather than yanking the user away).
    const url = err.config?.url ?? ''
    const isAuthAttempt =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh')

    if (status === 401 && !isAuthAttempt) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Avoid hard redirect loop while already on /login
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }

    let message = data?.message || data?.error || `Request failed (${status})`

    // --- Feign error parsing ---
    // Often microservices return FeignException messages that contain nested JSON like:
    // [500] during [GET] ... [{"message":"Clean message here",...}]
    if (typeof message === 'string' && message.includes('[{') && message.includes('}]')) {
      try {
        const jsonPart = message.substring(message.indexOf('[{'), message.lastIndexOf('}]') + 2)
        const parsed = JSON.parse(jsonPart)
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].message) {
          message = parsed[0].message
        }
      } catch (e) { /* ignore parse errors */ }
    } else if (typeof message === 'string' && message.includes('{') && message.includes('}')) {
       // Try single object JSON extraction
       try {
         const jsonPart = message.substring(message.indexOf('{'), message.lastIndexOf('}') + 1)
         const parsed = JSON.parse(jsonPart)
         if (parsed.message) message = parsed.message
       } catch (e) { /* ignore */ }
    }

    err.normalizedMessage = message
    return Promise.reject(err)
  }
)

/** Helper to pull a user-friendly message from any thrown axios error. */
export const getErrorMessage = (err, fallback = 'Something went wrong') => {
  const msg = err?.normalizedMessage || err?.response?.data?.message || err?.message || fallback
  // Clean up common technical prefixes if they still exist
  return msg.replace(/^Request failed with status code \d+: /, '')
            .replace(/^Internal Server Error: /, '')
}

export default apiClient
