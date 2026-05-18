import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiArrowRight, FiCheck, FiCreditCard, FiMinus, FiPlus,
  FiShoppingBag, FiTrash2, FiTruck
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useCart } from '../context/CartContext'
import { getErrorMessage } from '../services'
import './Cart.css'

export default function Cart() {
  const { items, total, removeFromCart, updateQuantity, clearCart, cartLoading } = useCart()
  const [busyItem, setBusyItem] = useState(null)

  const shippingCharge = (total > 0 && total < 499) ? 49 : 0;
  const finalTotal = total + shippingCharge;

  const handleRemove = async (itemId) => {
    setBusyItem(itemId)
    try {
      await removeFromCart(itemId)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to remove item'))
    } finally {
      setBusyItem(null)
    }
  }

  const handleQty = async (itemId, qty) => {
    if (qty < 1) return
    try {
      await updateQuantity(itemId, qty)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update quantity'))
    }
  }

  const handleClear = async () => {
    if (!window.confirm('Empty your cart?')) return
    await clearCart()
    toast.success('Cart cleared')
  }

  if (cartLoading) {
    return (
      <div className="cart-page page-enter">
        <div className="container cart-grid">
          <div className="skeleton" style={{ height: 400, borderRadius: 'var(--radius-lg)' }} />
          <div className="skeleton" style={{ height: 280, borderRadius: 'var(--radius-lg)' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page page-enter">
      <div className="container">
        <h2 className="cart-heading">
          <FiShoppingBag size={26} /> Shopping Cart
          {items.length > 0 && (
            <span className="cart-count">
              {items.length} item{items.length !== 1 ? 's' : ''}
            </span>
          )}
        </h2>

        {items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🛒</div>
            <h3>Your cart is empty</h3>
            <p className="text-muted">Discover books you'll love and add them here.</p>
            <Link to="/books" className="btn btn-primary btn-lg" style={{ marginTop: '1rem' }}>
              Browse Books <FiArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="cart-grid">
            <div className="cart-items">
              <div className="cart-items-header">
                <span>Product</span><span>Qty</span><span>Subtotal</span>
              </div>
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.itemId}
                    className="cart-item"
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -60, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="cart-item-info">
                      <div className="cart-book-thumb">{item.bookTitle?.[0]}</div>
                      <div style={{ minWidth: 0 }}>
                        <div className="cart-book-title">{item.bookTitle}</div>
                        <div className="cart-book-price">₹{item.price?.toFixed(2)} each</div>
                      </div>
                    </div>
                    <div className="qty-control">
                      <button
                        type="button" className="qty-btn"
                        onClick={() => handleQty(item.itemId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        <FiMinus size={14} />
                      </button>
                      <span className="qty-val">{item.quantity}</span>
                      <button
                        type="button" className="qty-btn"
                        onClick={() => handleQty(item.itemId, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        <FiPlus size={14} />
                      </button>
                    </div>
                    <div className="cart-subtotal">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </div>
                    <button
                      type="button" className="cart-remove"
                      onClick={() => handleRemove(item.itemId)}
                      disabled={busyItem === item.itemId}
                      aria-label="Remove item"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div className="cart-footer-actions">
                <Link to="/books" className="btn btn-ghost btn-sm">← Continue Shopping</Link>
                <button type="button" className="btn btn-ghost btn-sm" onClick={handleClear}>
                  Clear Cart
                </button>
              </div>
            </div>

            <div className="order-summary">
              <div className="summary-card">
                <h3 className="summary-title">Order Summary</h3>
                <div className="summary-rows">
                  <div className="summary-row">
                    <span>Subtotal ({items.length} items)</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Delivery</span>
                    {shippingCharge === 0 ? (
                      <span className="text-success">Free</span>
                    ) : (
                      <span>₹{shippingCharge.toFixed(2)}</span>
                    )}
                  </div>
                  <div className="summary-row total-row">
                    <span>Total</span>
                    <span>₹{finalTotal.toFixed(2)}</span>
                  </div>
                </div>
                <Link to="/checkout" className="btn btn-primary btn-full btn-lg">
                  Proceed to Checkout <FiArrowRight size={16} />
                </Link>
                <div className="trust-badges">
                  {[
                    { Icon: FiTruck,      label: 'Free delivery on ₹499+' },
                    { Icon: FiCreditCard, label: 'Secure payments' },
                    { Icon: FiCheck,      label: 'Easy returns' }
                  ].map(({ Icon, label }) => (
                    <div key={label} className="trust-badge">
                      <Icon size={14} color="var(--success)" />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
