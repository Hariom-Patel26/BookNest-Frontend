import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiCheckCircle, FiCreditCard, FiMapPin } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import {
  orderService, walletService, paymentService, bookService,
  loadRazorpayScript, getErrorMessage
} from '../services'
import './Cart.css'

const PAYMENT_MODES = {
  COD:      { key: 'COD',      icon: '🚚', label: 'Cash on Delivery', desc: 'Pay when you receive' },
  WALLET:   { key: 'WALLET',   icon: '💳', label: 'BookNest Wallet',  desc: 'Instant payment'      },
  RAZORPAY: { key: 'RAZORPAY', icon: '⚡', label: 'Card / UPI / Net Banking', desc: 'Powered by Razorpay' }
}

export default function Checkout() {
  const { user } = useAuth()
  const { items, total, clearCart, fetchCart } = useCart()
  const navigate = useNavigate()

  const shippingCharge = (total > 0 && total < 499) ? 49 : 0;
  const finalTotal = total + shippingCharge;

  const [paymentMode, setPaymentMode] = useState('COD')
  const [wallet, setWallet]           = useState(null)
  const [loading, setLoading]         = useState(false)
  const [codAvailable, setCodAvailable] = useState(true)
  const [address, setAddress]         = useState({
    fullName:     user?.fullName ?? '',
    mobileNumber: user?.mobile?.toString() ?? '',
    flatNumber:   user?.flatNumber ?? '',
    city:         user?.city ?? '',
    state:        user?.state ?? '',
    pincode:      user?.pincode ?? ''
  })

  useEffect(() => {
    if (!user?.userId) return
    walletService.getByUser(user.userId)
      .then((r) => setWallet(r.data))
      .catch(() => setWallet(null))
  }, [user])

  useEffect(() => {
    if (items.length === 0) return
    let cancelled = false
    
    // 1. Explicitly disable COD if any Mystery Box is present
    const hasMysteryBox = items.some(i => i.itemType === 'MYSTERY_BOX')
    if (hasMysteryBox) {
      setCodAvailable(false)
      if (paymentMode === 'COD') setPaymentMode('WALLET')
      return
    }

    // 2. Otherwise check individual books for COD support
    const booksToCheck = items.filter(i => i.bookId && i.itemType !== 'MYSTERY_BOX')
    
    if (booksToCheck.length === 0) {
      setCodAvailable(true)
      return
    }

    Promise.all(booksToCheck.map(i => bookService.getById(i.bookId)))
      .then(resArray => {
        if (cancelled) return
        const isAllCod = resArray.every(res => res.data?.codAvailable !== false)
        setCodAvailable(isAllCod)
        if (!isAllCod && paymentMode === 'COD') {
           setPaymentMode('WALLET')
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [items, paymentMode])

  const handleAddr = (e) => setAddress((a) => ({ ...a, [e.target.name]: e.target.value }))

  const validateAddress = () => {
    const required = ['fullName', 'mobileNumber', 'city', 'state', 'pincode']
    for (const f of required) {
      if (!address[f]?.toString().trim()) {
        toast.error('Please fill all required address fields')
        return false
      }
    }
    if (!/^\d{10}$/.test(address.mobileNumber)) {
      toast.error('Mobile number must be 10 digits')
      return false
    }
    if (!/^\d{6}$/.test(String(address.pincode))) {
      toast.error('Pincode must be 6 digits')
      return false
    }
    return true
  }

  const buildAddressPayload = () => ({
    customerId:   user.userId,
    fullName:     address.fullName,
    mobileNumber: address.mobileNumber,
    flatNumber:   address.flatNumber,
    city:         address.city,
    state:        address.state,
    pincode:      parseInt(address.pincode, 10) || 0
  })

  const buildItemsPayload = () =>
    items.map((i) => ({
      bookId:    i.bookId,
      bookTitle: i.bookTitle,
      price:     i.price,
      quantity:  i.quantity,
      itemType:  i.itemType,
      boxBookIds: i.boxBookIds
    }))

  const buildOrderPayload = (mode) => ({
    userId:      user.userId,
    paymentMode: mode === 'COD' ? 'CASH_ON_DELIVERY' : 'ONLINE_WALLET',
    totalAmount: finalTotal,
    address:     buildAddressPayload(),
    items:       buildItemsPayload()
  })

  // ─── COD ────────────────────────────────────────────────────────────────
  const placeCOD = async () => {
    await orderService.placeCOD(buildOrderPayload('COD'))
  }

  // ─── Wallet (FIX: place order first → debit with the real orderId) ──────
  const placeWalletOrder = async () => {
    if (!wallet)                          throw new Error('Please create a wallet first')
    if (wallet.currentBalance < finalTotal)    throw new Error(`Insufficient wallet balance. You need ₹${(finalTotal - wallet.currentBalance).toFixed(2)} more.`)

    // 1. Create the order — the backend now handles the wallet deduction
    //    and stock decrement in a single transaction (with saga rollback).
    const { data: order } = await orderService.placeOnline(buildOrderPayload('WALLET'))

    return order
  }

  // ─── Razorpay ──────────────────────────────────────────────────────────
  const placeRazorpayOrder = async () => {
    const ok = await loadRazorpayScript()
    if (!ok) throw new Error('Razorpay SDK failed to load. Check your network.')

    // 1. Create a Razorpay order on our backend (which calls Razorpay API)
    const { data: rzpOrder } = await paymentService.createRazorpayOrder({
      userId:  user.userId,
      amount:  finalTotal,
      address: buildAddressPayload(),
      items:   buildItemsPayload()
    })

    // 2. Open the checkout widget. Wrap callback flow in a Promise so we can
    //    `await` the user's interaction.
    return new Promise((resolve, reject) => {
      const rzp = new window.Razorpay({
        key:      rzpOrder.keyId,
        amount:   rzpOrder.amount,
        currency: rzpOrder.currency,
        name:     'BookNest',
        description: `Order for ${items.length} book${items.length !== 1 ? 's' : ''}`,
        order_id: rzpOrder.razorpayOrderId,
        prefill: {
          name:    user.fullName,
          email:   user.email,
          contact: address.mobileNumber
        },
        theme: { color: '#0f1f3d' },
        // Step 3: server verifies HMAC signature & materialises the order.
        handler: async (response) => {
          try {
            const { data: order } = await paymentService.verifyRazorpayPayment({
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              userId:  user.userId,
              amount:  finalTotal,
              address: buildAddressPayload(),
              items:   buildItemsPayload()
            })
            resolve(order)
          } catch (err) {
            reject(new Error(getErrorMessage(err, 'Payment verification failed')))
          }
        },
        modal: {
          ondismiss: () => reject(new Error('Payment cancelled'))
        }
      })
      rzp.on('payment.failed', (err) => {
        reject(new Error(err.error?.description ?? 'Payment failed'))
      })
      rzp.open()
    })
  }

  const handlePlaceOrder = async () => {
    if (!validateAddress()) return
    setLoading(true)
    try {
      if (paymentMode === 'COD')      await placeCOD()
      if (paymentMode === 'WALLET')   await placeWalletOrder()
      if (paymentMode === 'RAZORPAY') await placeRazorpayOrder()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Order failed. Please try again.'))
      setLoading(false)
      return
    }

    // Order placed successfully — clean up cart (don't let cleanup failures show as order errors)
    try {
      await clearCart()
      await fetchCart()
    } catch {
      // Cart cleanup failed but order was placed — ignore silently
    }

    toast.success('Order placed successfully! 🎉')
    setLoading(false)
    navigate('/orders')
  }

  if (items.length === 0) {
    return (
      <div className="checkout-page page-enter">
        <div className="container">
          <div className="empty-state">
            <div className="empty-state-icon">🛒</div>
            <h3>Your cart is empty</h3>
            <Link to="/books" className="btn btn-primary mt-4">Browse Books</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-page page-enter">
      <div className="container">
        <Link
          to="/cart"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            color: 'var(--gray-500)',
            marginBottom: '1.5rem',
            fontSize: '.875rem'
          }}
        >
          <FiArrowLeft size={16} /> Back to Cart
        </Link>
        <h2 className="checkout-heading">Checkout</h2>

        <div className="checkout-grid">
          <div>
            {/* Address */}
            <div className="checkout-card">
              <div className="checkout-section-title">
                <FiMapPin color="var(--amber)" /> Delivery Address
              </div>
              <div className="checkout-form-grid">
                {[
                  { name: 'fullName',     label: 'Full Name *',      placeholder: 'Jane Doe',     fullWidth: true },
                  { name: 'mobileNumber', label: 'Mobile Number *',  placeholder: '9999999999',   type: 'tel'    },
                  { name: 'flatNumber',   label: 'Flat / House No.', placeholder: 'Flat 4B'                       },
                  { name: 'city',         label: 'City *',           placeholder: 'Mumbai'                        },
                  { name: 'state',        label: 'State *',          placeholder: 'Maharashtra'                   },
                  { name: 'pincode',      label: 'Pincode *',        placeholder: '400001',       type: 'tel'    }
                ].map((f) => (
                  <div key={f.name} className="form-group" style={f.fullWidth ? { gridColumn: '1/-1' } : {}}>
                    <label className="form-label">{f.label}</label>
                    <input
                      name={f.name}
                      className="form-control"
                      placeholder={f.placeholder}
                      value={address[f.name]}
                      onChange={handleAddr}
                      type={f.type ?? 'text'}
                      autoComplete="off"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Payment */}
            <div className="checkout-card">
              <div className="checkout-section-title">
                <FiCreditCard color="var(--amber)" /> Payment Method
              </div>
              <div className="payment-options">
                {Object.values(PAYMENT_MODES).map((m) => {
                  const isCod = m.key === 'COD';
                  const isDisabled = isCod && !codAvailable;
                  return (
                  <button
                    type="button"
                    key={m.key}
                    className={`payment-option ${paymentMode === m.key ? 'selected' : ''}`}
                    onClick={() => !isDisabled && setPaymentMode(m.key)}
                    aria-pressed={paymentMode === m.key}
                    disabled={isDisabled}
                    style={isDisabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  >
                    <div className="payment-icon">{m.icon}</div>
                    <div className="payment-label">{m.label}</div>
                    <div className="payment-desc">
                      {isDisabled ? 'Not available for your items' : m.desc}
                    </div>
                  </button>
                )})}
              </div>

              {paymentMode === 'WALLET' && wallet && (
                <div className="wallet-balance-info">
                  <span className="wb-label">Wallet Balance</span>
                  <span className="wb-amount">₹{wallet.currentBalance?.toFixed(2)}</span>
                </div>
              )}
              {paymentMode === 'WALLET' && !wallet && (
                <div className="wallet-balance-info" style={{ background: '#fee2e2', borderColor: '#fca5a5' }}>
                  <span className="wb-label">No wallet found.</span>
                  <Link to="/wallet" className="btn btn-sm btn-amber">Create Wallet</Link>
                </div>
              )}
              {paymentMode === 'RAZORPAY' && (
                <div className="wallet-balance-info" style={{ background: '#e0f2fe', borderColor: '#7dd3fc' }}>
                  <span className="wb-label">You'll be redirected to Razorpay to complete payment securely.</span>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="order-summary">
            <div className="summary-card">
              <h3 className="summary-title">Order Summary</h3>
              <div className="summary-rows">
                {items.map((i) => (
                  <div key={i.itemId} className="summary-row">
                    <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {i.bookTitle} × {i.quantity}
                    </span>
                    <span>₹{(i.price * i.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="summary-row">
                  <span>Delivery</span>
                  {shippingCharge === 0 ? (
                    <span className="text-success">Free</span>
                  ) : (
                    <span>₹{shippingCharge.toFixed(2)}</span>
                  )}
                </div>
                <div className="summary-row total-row">
                  <span>Total</span><span>₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-full btn-lg"
                onClick={handlePlaceOrder}
                disabled={loading}
              >
                {loading
                  ? 'Processing…'
                  : <><FiCheckCircle size={18} /> Place Order</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
