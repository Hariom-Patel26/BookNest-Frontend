import api from './apiClient'

/**
 * Auth service — talks to /api/v1/auth/*.
 *
 * NOTE: All public-facing registrations are sent WITHOUT a `role` field.
 * The backend defaults new users to `CUSTOMER`. Role escalation is handled
 * exclusively by the admin user-management endpoint below.
 */
const authService = {
  /** Register a new user (always CUSTOMER on the server side). */
  register: (payload) => {
    // Defensive — strip any role that might have leaked into the payload.
    const { role, ...safe } = payload
    return api.post('/auth/register', safe)
  },

  login:    (data) => api.post('/auth/login', data),
  logout:   (token) => api.post('/auth/logout', {}, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  refresh:  (refreshToken) => api.post('/auth/refresh', { refreshToken }),

  // ─── Profile ──────────────────────────────────────────
  getProfile:     (userId) => api.get(`/auth/profile/${userId}`),
  updateProfile:  (userId, data) => api.put(`/auth/profile/${userId}`, data),
  changePassword: (userId, data) => api.put(`/auth/change-password/${userId}`, data),

  // ─── Password Reset ───────────────────────────────────
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword:  (data) => api.post('/auth/reset-password', data),

  // ─── Admin user management ────────────────────────────
  getAllUsers:  ()       => api.get('/auth/users'),
  getUserById:  (userId) => api.get(`/auth/users/${userId}`),
  suspendUser:  (userId) => api.put(`/auth/users/${userId}/suspend`),
  activateUser: (userId) => api.put(`/auth/users/${userId}/activate`),
  deleteUser:   (userId) => api.delete(`/auth/users/${userId}`),

  /**
   * Promote a CUSTOMER to ADMIN, or demote an ADMIN to CUSTOMER.
   * Admin-only — protected at both the gateway (JWT role claim) and the UI.
   *
   * Backend endpoint expected: PUT /api/v1/auth/users/:userId/role  body: { role }
   * (See README "Backend prerequisites".)
   */
  updateUserRole: (userId, role) =>
    api.put(`/auth/users/${userId}/role`, { role })
}

export default authService
