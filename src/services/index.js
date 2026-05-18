/**
 * Barrel re-exports — import any service from one place:
 *   import { authService, bookService } from '@/services'
 */
export { default as apiClient }           from './apiClient'
export { getErrorMessage }                from './apiClient'
export { default as authService }         from './authService'
export { default as bookService }         from './bookService'
export { default as cartService }         from './cartService'
export { default as orderService }        from './orderService'
export { default as walletService }       from './walletService'
export { default as reviewService }       from './reviewService'
export { default as notificationService } from './notificationService'
export { default as wishlistService }     from './wishlistService'
export { default as paymentService, loadRazorpayScript } from './paymentService'
