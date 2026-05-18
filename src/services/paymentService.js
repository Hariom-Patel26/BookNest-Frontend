import api from './apiClient'

/**
 * Razorpay payment endpoints (mounted under /api/v1/orders/payment).
 * Must align with the backend `PaymentController` we added in order-service.
 */
const paymentService = {
  /** Step 1: ask the server to create a Razorpay order. */
  createRazorpayOrder: (payload) =>
    api.post('/orders/payment/create-razorpay-order', payload),

  /** Step 2: hand the JS-SDK callback fields back to the server for HMAC verification. */
  verifyRazorpayPayment: (payload) =>
    api.post('/orders/payment/verify', payload)
}

/**
 * Lazily inject the Razorpay checkout script (only when the user actually pays
 * online — no payload tax for the rest of the app).
 */
export const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

export default paymentService
