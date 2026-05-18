import api from './apiClient'

const wishlistService = {
  getWishlist:   (userId) => api.get(`/wishlist/${userId}`),
  addBook:       (userId, data) => api.post(`/wishlist/${userId}/add`, data),
  removeBook:    (userId, bookId) => api.delete(`/wishlist/${userId}/remove/${bookId}`),
  clearWishlist: (userId) => api.delete(`/wishlist/${userId}/clear`),
  moveToCart:    (userId, bookId) => api.post(`/wishlist/${userId}/move-to-cart/${bookId}`)
}

export default wishlistService
