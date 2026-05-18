import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { orderService, getErrorMessage } from '../../services'

const STATUSES = ['PLACED', 'CONFIRMED', 'DISPATCHED', 'DELIVERED', 'CANCELLED']
const STATUS_COLORS = {
  PLACED:     'var(--warning)',
  CONFIRMED:  'var(--info)',
  DISPATCHED: 'var(--navy)',
  DELIVERED:  'var(--success)',
  CANCELLED:  'var(--danger)'
}

export default function AdminOrders() {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('')

  const fetchAll = useCallback(() => {
    setLoading(true)
    orderService.getAll()
      .then((r) => {
        const sorted = (r.data ?? []).sort((a, b) => b.orderId - a.orderId)
        setOrders(sorted)
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleStatus = async (id, status) => {
    try {
      await orderService.changeStatus(id, status)
      toast.success('Status updated')
      fetchAll()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Update failed'))
    }
  }

  const filtered = filter ? orders.filter((o) => o.orderStatus === filter) : orders

  return (
    <div className="admin-page page-enter">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Orders</h2>
        <select
          className="form-control"
          style={{ width: 180 }}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th><th>User</th><th>Amount</th><th>Payment</th>
                <th>Status</th><th>Date</th><th>Update</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7}><div className="skeleton" style={{ height: 20 }} /></td>
                    </tr>
                  ))
                : filtered.map((o) => (
                    <tr key={o.orderId}>
                      <td className="fw-600">#{o.orderId}</td>
                      <td>{o.userId}</td>
                      <td>₹{o.amountPaid?.toFixed(2)}</td>
                      <td style={{ fontSize: '.8rem' }}>{o.modeOfPayment?.replace(/_/g, ' ')}</td>
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
                      <td>
                        <select
                          className="form-control"
                          style={{ width: 140, fontSize: '.8rem', padding: '.3rem .5rem' }}
                          value={o.orderStatus}
                          onChange={(e) => handleStatus(o.orderId, e.target.value)}
                          aria-label="Change status"
                          disabled={o.orderStatus === 'CANCELLED' || o.orderStatus === 'DELIVERED'}
                        >
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="empty-row">No orders found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
