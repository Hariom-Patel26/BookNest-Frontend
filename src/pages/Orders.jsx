import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FiCheckCircle, FiClock, FiPackage, FiTruck, FiXCircle
} from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { orderService } from '../services'
import { PageLoader, EmptyState } from '../components/ui/index.jsx'
import './Account.css'

const STATUS_CONFIG = {
  PLACED:     { Icon: FiClock,       color: 'var(--warning)', bg: 'var(--warning-bg)', label: 'Placed' },
  CONFIRMED:  { Icon: FiCheckCircle, color: 'var(--info)',    bg: 'var(--info-bg)',    label: 'Confirmed' },
  DISPATCHED: { Icon: FiTruck,       color: 'var(--navy)',    bg: '#dbeafe',           label: 'Dispatched' },
  DELIVERED:  { Icon: FiCheckCircle, color: 'var(--success)', bg: 'var(--success-bg)', label: 'Delivered' },
  CANCELLED:  { Icon: FiXCircle,     color: 'var(--danger)',  bg: 'var(--danger-bg)',  label: 'Cancelled' }
}

export default function Orders() {
  const { user } = useAuth()
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.userId) return
    let cancelled = false
    orderService.getByUser(user.userId)
      .then((r) => { 
        if (!cancelled) {
          const sorted = (r.data ?? []).sort((a, b) => b.orderId - a.orderId)
          setOrders(sorted)
        }
      })
      .catch(() => { if (!cancelled) setOrders([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user])

  if (loading) return <PageLoader />

  return (
    <div className="account-page page-enter">
      <div className="container-narrow">
        <h2 className="account-heading"><FiPackage /> My Orders</h2>

        {orders.length === 0 ? (
          <EmptyState
            icon="📦"
            title="No orders yet"
            description="Start shopping to see your orders here."
            action={<Link to="/books" className="btn btn-primary mt-4">Browse Books</Link>}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {orders.map((order) => {
              const cfg = STATUS_CONFIG[order.orderStatus] ?? STATUS_CONFIG.PLACED
              return (
                <motion.div
                  key={order.orderId}
                  className="account-card order-card"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="order-header">
                    <div>
                      <div className="order-id">Order #{order.orderId}</div>
                      <div className="order-date text-muted" style={{ fontSize: '.8rem' }}>
                        {order.orderDate}
                      </div>
                    </div>
                    <span
                      className="order-status-badge"
                      style={{ background: cfg.bg, color: cfg.color }}
                    >
                      <cfg.Icon size={13} /> {cfg.label}
                    </span>
                  </div>

                  <div className="order-items-list">
                    {(order.items ?? []).map((item) => (
                      <div key={item.orderItemId} className="order-item-row">
                        <span>{item.bookTitle} × {item.quantity}</span>
                        <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="order-footer">
                    <span className="text-muted" style={{ fontSize: '.8rem' }}>
                      {order.modeOfPayment?.replace(/_/g, ' ')}
                    </span>
                    <span className="order-total">Total: ₹{order.amountPaid?.toFixed(2)}</span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
