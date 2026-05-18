import api from './apiClient'

const notificationService = {
  getByUser:      (userId) => api.get(`/notifications/user/${userId}`),
  getUnreadCount: (userId) => api.get(`/notifications/user/${userId}/unread-count`),
  markRead:       (id) => api.patch(`/notifications/${id}/read`),
  markAllRead:    (userId) => api.patch(`/notifications/user/${userId}/read-all`),
  delete:         (id) => api.delete(`/notifications/${id}`),
  getAll:         () => api.get('/notifications')
}

export default notificationService
