import api from './apiClient'

const orderService = {
  getAll:        () => api.get('/orders'),
  getById:       (id) => api.get(`/orders/${id}`),
  getByUser:     (userId) => api.get(`/orders/user/${userId}`),
  placeCOD:      (data) => api.post('/orders/place', data),
  placeOnline:   (data) => api.post('/orders/online-payment', data),
  changeStatus:  (id, status) => api.put(`/orders/${id}/status`, { status }),
  deleteOrder:   (id) => api.delete(`/orders/${id}`),
  getAddresses:  (customerId) => api.get(`/orders/address/customer/${customerId}`)
}

export default orderService
