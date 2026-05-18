import { useCallback, useEffect, useState } from 'react'
import { FiBell, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { notificationService, getErrorMessage } from '../services'
import { PageLoader, EmptyState } from '../components/ui/index.jsx'
import './Account.css'

export default function Notifications() {
  const { user } = useAuth()
  const [notifs, setNotifs]   = useState([])
  const [loading, setLoading] = useState(true)

  const fetchNotifs = useCallback(() => {
    if (!user?.userId) return
    setLoading(true)
    notificationService.getByUser(user.userId)
      .then((r) => {
        const sorted = (r.data ?? []).sort((a, b) => b.notificationId - a.notificationId)
        setNotifs(sorted)
      })
      .catch(() => setNotifs([]))
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => { fetchNotifs() }, [fetchNotifs])

  const markAll = async () => {
    try {
      await notificationService.markAllRead(user.userId)
      fetchNotifs()
      toast.success('All marked as read')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to mark all read'))
    }
  }

  const markOne = async (id) => {
    try {
      await notificationService.markRead(id)
      fetchNotifs()
    } catch { /* silent */ }
  }

  const del = async (id) => {
    try {
      await notificationService.delete(id)
      setNotifs((n) => n.filter((x) => x.notificationId !== id))
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete'))
    }
  }

  if (loading) return <PageLoader />

  const unread = notifs.filter((n) => !n.read).length

  const iconFor = (type) => {
    if (type?.includes('ORDER'))   return '📦'
    if (type?.includes('PAYMENT')) return '💳'
    if (type?.includes('WALLET'))  return '💰'
    return '🔔'
  }

  return (
    <div className="account-page page-enter">
      <div className="container-narrow">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <h2 className="account-heading" style={{ marginBottom: 0 }}>
            <FiBell /> Notifications
            {unread > 0 && <span className="notif-unread-badge">{unread}</span>}
          </h2>
          {unread > 0 && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={markAll}>
              Mark all read
            </button>
          )}
        </div>

        {notifs.length === 0 ? (
          <EmptyState
            icon="🔔"
            title="No notifications"
            description="We'll notify you about orders, payments, and more."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {notifs.map((n) => (
              <div
                key={n.notificationId}
                className={`account-card notif-card ${!n.read ? 'unread' : ''}`}
                onClick={() => !n.read && markOne(n.notificationId)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !n.read) {
                    markOne(n.notificationId)
                  }
                }}
              >
                <div className="notif-icon">{iconFor(n.type)}</div>
                <div className="notif-body">
                  <div className="notif-type">{n.type?.replace(/_/g, ' ')}</div>
                  <div className="notif-message">{n.message}</div>
                  <div className="notif-time text-muted">
                    {n.createdAt?.split('T')[0]}
                  </div>
                </div>
                {!n.read && <div className="notif-dot" />}
                <button
                  type="button"
                  className="notif-delete btn btn-ghost btn-sm btn-icon"
                  onClick={(e) => { e.stopPropagation(); del(n.notificationId) }}
                  aria-label="Delete notification"
                >
                  <FiX size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
