import api from './apiClient'

const walletService = {
  createWallet:  (userId) => api.post(`/wallet/create/${userId}`),
  getByUser:     (userId) => api.get(`/wallet/user/${userId}`),
  getBalance:    (walletId) => api.get(`/wallet/${walletId}`),
  addMoney:      (walletId, data) => api.post(`/wallet/${walletId}/add-money`, data),
  /** Debit the wallet. data: { amount, orderId, remarks } */
  payMoney:      (walletId, data) => api.post(`/wallet/${walletId}/pay`, data),
  getStatements: (walletId) => api.get(`/wallet/${walletId}/statements`),
  getAll:        () => api.get('/wallet'),

  // ─── Razorpay integration ──────────────────────────────────────────────
  /** Create a Razorpay order for wallet top-up */
  createRazorpayOrder: (walletId, amount) =>
    api.post(`/wallet/${walletId}/razorpay/create-order`, { amount }),

  /** Verify Razorpay payment and credit the wallet */
  verifyRazorpayPayment: (walletId, data) =>
    api.post(`/wallet/${walletId}/razorpay/verify-payment`, data)
}

export default walletService
