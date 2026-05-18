import api from './apiClient'

const reviewService = {
  getByBook:    (bookId) => api.get(`/reviews/book/${bookId}`),
  getByUser:    (userId) => api.get(`/reviews/user/${userId}`),
  getAvgRating: (bookId) => api.get(`/reviews/book/${bookId}/avg-rating`),
  addReview:    (data) => api.post('/reviews', data),
  updateReview: (id, data) => api.put(`/reviews/${id}`, data),
  deleteReview: (id) => api.delete(`/reviews/${id}`),
  getAll:       () => api.get('/reviews')
}

export default reviewService
