import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiBook, FiShoppingBag, FiStar, FiUsers } from 'react-icons/fi'
import { authService, bookService, orderService, reviewService } from '../../services'
import { PageLoader } from '../../components/ui/index.jsx'

const STATUS_COLORS = {
  PLACED:     'var(--warning)',
  CONFIRMED:  'var(--info)',
  DISPATCHED: 'var(--navy)',
  DELIVERED:  'var(--success)',
  CANCELLED:  'var(--danger)'
}

export default function AdminDashboard() {
  const [stats, setStats]     = useState({ books: 0, orders: 0, users: 0, reviews: 0 })
  const [recent, setRecent]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      bookService.getAll(),
      orderService.getAll(),
      authService.getAllUsers(),
      reviewService.getAll()
    ]).then((results) => {
      const [b, o, u, r] = results
      setStats({
        books:   b.status === 'fulfilled' ? (b.value.data ?? []).length : 0,
        orders:  o.status === 'fulfilled' ? (o.value.data ?? []).length : 0,
        users:   u.status === 'fulfilled' ? (u.value.data ?? []).length : 0,
        reviews: r.status === 'fulfilled' ? (r.value.data ?? []).length : 0
      })
      setRecent(o.status === 'fulfilled' ? (o.value.data ?? []).sort((a,b) => b.orderId - a.orderId).slice(0, 5) : [])
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  return (
    <div className="admin-page page-enter">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Dashboard</h2>
        <span className="text-muted" style={{ fontSize: '.875rem' }}>Welcome back, Admin</span>
      </div>

      <div className="stat-cards">
        {[
          { label: 'Total Books',   value: stats.books,   Icon: FiBook,        color: 'var(--navy)'    },
          { label: 'Total Orders',  value: stats.orders,  Icon: FiShoppingBag, color: 'var(--amber)'   },
          { label: 'Total Users',   value: stats.users,   Icon: FiUsers,       color: 'var(--success)' },
          { label: 'Total Reviews', value: stats.reviews, Icon: FiStar,        color: 'var(--info)'    }
        ].map((s) => (
          <motion.div
            key={s.label}
            className="stat-card"
            whileHover={{ y: -2 }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="stat-card-icon" style={{ background: `${s.color}18` }}>
              <s.Icon size={20} color={s.color} />
            </div>
            <div className="stat-val">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="admin-card">
        <h4 className="admin-card-title">Recent Orders</h4>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th><th>User ID</th><th>Amount</th>
                <th>Payment</th><th>Status</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.orderId}>
                  <td className="fw-600">#{o.orderId}</td>
                  <td>{o.userId}</td>
                  <td>₹{o.amountPaid?.toFixed(2)}</td>
                  <td>{o.modeOfPayment?.replace(/_/g, ' ')}</td>
                  <td>
                    <span
                      className="status-pill"
                      style={{
                        background: `${STATUS_COLORS[o.orderStatus]}18`,
                        color:      STATUS_COLORS[o.orderStatus]
                      }}
                    >
                      {o.orderStatus}
                    </span>
                  </td>
                  <td>{o.orderDate}</td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr><td colSpan={6} className="empty-row">No orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Link to="/admin/orders" className="view-all-link">View all orders →</Link>
      </div>
    </div>
  )
}
