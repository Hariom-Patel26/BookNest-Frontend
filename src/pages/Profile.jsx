import { useState } from 'react'
import { FiUser } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { authService, getErrorMessage } from '../services'
import './Account.css'

export default function Profile() {
  const { user, updateUser } = useAuth()

  const [form, setForm] = useState({
    fullName: user?.fullName ?? '',
    mobile: user?.mobile ?? '',
    flatNumber: user?.flatNumber ?? '',
    city: user?.city ?? '',
    state: user?.state ?? '',
    pincode: user?.pincode ?? ''
  })
  const [saving, setSaving] = useState(false)

  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '' })
  const [savingPw, setSavingPw] = useState(false)

  const handleUpdate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await authService.updateProfile(user.userId, {
        fullName: form.fullName.trim(),
        mobile: form.mobile ? Number(form.mobile) : null,
        flatNumber: form.flatNumber.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim()
      })
      updateUser({ ...user, ...res.data })
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Update failed'))
    } finally {
      setSaving(false)
    }
  }

  const handlePw = async (e) => {
    e.preventDefault()
    if (pwForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }
    setSavingPw(true)
    try {
      await authService.changePassword(user.userId, pwForm)
      toast.success('Password changed!')
      setPwForm({ oldPassword: '', newPassword: '' })
    } catch (err) {
      toast.error(getErrorMessage(err, 'Incorrect current password'))
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <div className="account-page page-enter">
      <div className="container-narrow">
        <h2 className="account-heading"><FiUser /> My Profile</h2>

        <div className="account-card">
          <div className="profile-hero">
            <div className="profile-avatar-lg">{user?.fullName?.[0]?.toUpperCase() ?? '?'}</div>
            <div>
              <h3 style={{ color: 'var(--navy)', fontFamily: 'var(--font-display)' }}>
                {user?.fullName}
              </h3>
              <p className="text-muted">{user?.email}</p>
              <span className={`badge ${user?.role === 'ADMIN' ? 'badge-amber' : 'badge-navy'}`}>
                {user?.role}
              </span>
            </div>
          </div>
          <form onSubmit={handleUpdate} className="account-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-control"
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mobile</label>
              <input
                className="form-control"
                type="tel"
                value={form.mobile}
                onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
                placeholder="9999999999"
              />
            </div>

            <h4 className="card-section-title mt-6">Delivery Address</h4>
            <div className="form-group">
              <label className="form-label">Flat / House No.</label>
              <input
                className="form-control"
                value={form.flatNumber}
                onChange={(e) => setForm((f) => ({ ...f, flatNumber: e.target.value }))}
                placeholder="Flat 4B, Emerald Apts"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  className="form-control"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  placeholder="Bhopal"
                />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input
                  className="form-control"
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                  placeholder="Madhya Pradesh"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Pincode</label>
              <input
                className="form-control"
                value={form.pincode}
                onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
                placeholder="400001"
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>

        <div className="account-card mt-6">
          <h4 className="card-section-title">Change Password</h4>
          <form onSubmit={handlePw} className="account-form">
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-control"
                value={pwForm.oldPassword}
                onChange={(e) => setPwForm((f) => ({ ...f, oldPassword: e.target.value }))}
                autoComplete="current-password"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-control"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
                autoComplete="new-password"
                required
                minLength={6}
              />
            </div>
            <button type="submit" className="btn btn-outline" disabled={savingPw}>
              {savingPw ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
