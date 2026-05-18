import api from './apiClient'

const cartService = {
  getCart:        (userId) => api.get(`/cart/${userId}`),
  addItem:        (userId, data) => api.post(`/cart/${userId}/add`, data),
  removeItem:     (userId, itemId) => api.delete(`/cart/${userId}/remove/${itemId}`),
  updateQuantity: (userId, itemId, quantity) =>
                    api.put(`/cart/${userId}/update/${itemId}`, { quantity }),
  clearCart:      (userId) => api.delete(`/cart/${userId}/clear`),
  addMysteryBox: (userId, genre) =>
    api.post(`/cart/${userId}/mystery-box`, { genre }),
}

export default cartService
