import { useCallback, useEffect, useState } from 'react'
import { FiShield } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { authService, getErrorMessage } from '../../services'

export default function AdminUsers() {
  const { user: currentUser } = useAuth()
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy]       = useState(null)

  const fetchAll = useCallback(() => {
    setLoading(true)
    authService.getAllUsers()
      .then((r) => setUsers(r.data ?? []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const toggleActive = async (u) => {
    setBusy(u.userId)
    try {
      if (u.active) {
        await authService.suspendUser(u.userId)
        toast.success(`${u.fullName} suspended`)
      } else {
        await authService.activateUser(u.userId)
        toast.success(`${u.fullName} activated`)
      }
      fetchAll()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Action failed'))
    } finally {
      setBusy(null)
    }
  }


  return (
    <div className="admin-page page-enter">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Users</h2>
        <span className="text-muted" style={{ fontSize: '.875rem' }}>
          {users.length} total
        </span>
      </div>

      <div className="admin-card" style={{ marginBottom: '1rem' }}>
        <p className="text-muted" style={{ fontSize: '.85rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <FiShield size={14} color="var(--amber)" />
          User accounts are created as <strong>CUSTOMER</strong> by default. 
          Suspended users cannot log in or place orders.
        </p>
      </div>

      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Email</th>
                <th>Role</th><th>Provider</th><th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7}><div className="skeleton" style={{ height: 20 }} /></td>
                    </tr>
                  ))
                : users.map((u) => {
                    const self = u.userId === currentUser?.userId
                    return (
                      <tr key={u.userId}>
                        <td className="fw-600">#{u.userId}</td>
                        <td className="fw-600">
                          {u.fullName}
                          {self && <span className="badge badge-info" style={{ marginLeft: 6 }}>You</span>}
                        </td>
                        <td style={{ fontSize: '.85rem' }}>{u.email}</td>
                        <td>
                          <span className={`badge ${u.role === 'ADMIN' ? 'badge-amber' : 'badge-navy'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>{u.provider}</td>
                        <td>
                          <span className={`badge ${u.active ? 'badge-success' : 'badge-danger'}`}>
                            {u.active ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>

                            <button
                              type="button"
                              className={`btn btn-sm ${u.active ? 'btn-danger' : 'btn-outline'}`}
                              onClick={() => toggleActive(u)}
                              disabled={busy === u.userId || self}
                            >
                              {u.active ? 'Suspend' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
