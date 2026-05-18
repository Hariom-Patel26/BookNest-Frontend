import { useCallback, useEffect, useState } from 'react'
import { FiCreditCard, FiMinus, FiPlus, FiShield } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { walletService, getErrorMessage } from '../services'
import { PageLoader } from '../components/ui/index.jsx'
import './Account.css'

const QUICK_AMOUNTS = [100, 200, 500, 1000]

export default function Wallet() {
  const { user } = useAuth()
  const [wallet, setWallet]         = useState(null)
  const [statements, setStatements] = useState([])
  const [loading, setLoading]       = useState(true)
  const [amount, setAmount]         = useState('')
  const [adding, setAdding]         = useState(false)
  const [creating, setCreating]     = useState(false)

  const fetchWallet = useCallback(async () => {
    if (!user?.userId) return
    try {
      const r = await walletService.getByUser(user.userId)
      setWallet(r.data)
      const s = await walletService.getStatements(r.data.walletId)
      setStatements(s.data ?? [])
    } catch (err) {
      // 404 simply means no wallet yet
      if (err.response?.status !== 404) {
        toast.error(getErrorMessage(err, 'Failed to load wallet'))
      }
      setWallet(null)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchWallet() }, [fetchWallet])

  const handleCreate = async () => {
    setCreating(true)
    try {
      await walletService.createWallet(user.userId)
      await fetchWallet()
      toast.success('Wallet created!')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Wallet creation failed'))
    } finally {
      setCreating(false)
    }
  }

  // ─── Razorpay Checkout Flow ─────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault()
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) {
      toast.error('Enter a valid amount')
      return
    }

    setAdding(true)
    try {
      // Step 1: Create Razorpay order on backend
      const { data } = await walletService.createRazorpayOrder(wallet.walletId, value)

      // Step 2: Open Razorpay Checkout
      const options = {
        key: data.keyId,
        amount: data.amount,       // in paise
        currency: data.currency,
        name: 'BookNest',
        description: 'Wallet Top-up',
        order_id: data.orderId,
        handler: async (response) => {
          // Step 3: Verify payment on backend and credit wallet
          try {
            await walletService.verifyRazorpayPayment(wallet.walletId, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            })
            await fetchWallet()
            setAmount('')
            toast.success(`₹${value} added successfully!`)
          } catch (err) {
            toast.error(getErrorMessage(err, 'Payment verification failed'))
          } finally {
            setAdding(false)
          }
        },
        prefill: {
          name: user?.fullName || '',
          email: user?.email || ''
        },
        theme: {
          color: '#d4a259'
        },
        modal: {
          ondismiss: () => {
            setAdding(false)
            toast('Payment cancelled', { icon: '❌' })
          }
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (resp) => {
        setAdding(false)
        toast.error(resp.error?.description || 'Payment failed')
      })
      rzp.open()

      // Note: setAdding(false) is handled in handler/ondismiss/payment.failed
      // We don't reset it here because the checkout modal is still open
    } catch (err) {
      setAdding(false)
      toast.error(getErrorMessage(err, 'Failed to initiate payment'))
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="account-page page-enter">
      <div className="container-narrow">
        <h2 className="account-heading"><FiCreditCard /> My Wallet</h2>

        {!wallet ? (
          <div className="account-card text-center" style={{ padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💳</div>
            <h3 style={{ color: 'var(--navy)', marginBottom: '0.5rem' }}>No Wallet Yet</h3>
            <p className="text-muted mb-6">
              Create your BookNest e-wallet to pay instantly at checkout.
            </p>
            <button
              type="button"
              className="btn btn-amber btn-lg"
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? 'Creating…' : 'Create My Wallet'}
            </button>
          </div>
        ) : (
          <>
            <div className="wallet-hero">
              <div className="wallet-card-visual">
                <div className="wallet-card-top">
                  <div className="wallet-brand">BookNest Wallet</div>
                  <FiCreditCard size={24} color="rgba(255,255,255,.5)" />
                </div>
                <div className="wallet-balance-display">
                  <div className="wb-label-small">Current Balance</div>
                  <div className="wb-big">₹{wallet.currentBalance?.toFixed(2)}</div>
                </div>
                <div className="wallet-card-bottom">
                  <span style={{ opacity: 0.6, fontSize: '.8rem' }}>Wallet #{wallet.walletId}</span>
                </div>
              </div>

              <div className="add-money-form">
                <h4 className="card-section-title">Add Money</h4>
                <form onSubmit={handleAdd}>
                  <div className="amount-input-wrap">
                    <span className="currency-symbol">₹</span>
                    <input
                      type="number"
                      className="form-control amount-input"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="1"
                    />
                  </div>
                  <div className="quick-amounts">
                    {QUICK_AMOUNTS.map((a) => (
                      <button
                        key={a}
                        type="button"
                        className="quick-amt-btn"
                        onClick={() => setAmount(String(a))}
                      >
                        +₹{a}
                      </button>
                    ))}
                  </div>
                  <button type="submit" className="btn btn-amber btn-full" disabled={adding}>
                    {adding ? 'Processing…' : 'Pay via Razorpay'}
                  </button>
                  <div className="razorpay-secure-badge">
                    <FiShield size={13} />
                    <span>Secured by Razorpay</span>
                  </div>
                </form>
              </div>
            </div>

            <div className="account-card mt-6">
              <h4 className="card-section-title">Transaction History</h4>
              {statements.length === 0 ? (
                <p className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>
                  No transactions yet.
                </p>
              ) : (
                <div className="stmt-list">
                  {statements.slice().reverse().map((s) => {
                    const isDeposit = s.transactionType === 'DEPOSIT'
                    return (
                      <div key={s.statementId} className="stmt-row">
                        <div className={`stmt-type-icon ${isDeposit ? 'deposit' : 'withdraw'}`}>
                          {isDeposit ? <FiPlus size={14} /> : <FiMinus size={14} />}
                        </div>
                        <div className="stmt-info">
                          <div className="stmt-remark">
                            {s.transactionRemarks || s.transactionType}
                          </div>
                          <div className="stmt-date text-muted">
                            {s.dateTime?.split('T')[0]}
                          </div>
                        </div>
                        <div className={`stmt-amount ${isDeposit ? 'credit' : 'debit'}`}>
                          {isDeposit ? '+' : '-'}₹{s.amount?.toFixed(2)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
