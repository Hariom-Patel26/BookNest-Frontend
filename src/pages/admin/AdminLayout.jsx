import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  FiBarChart2, FiBook, FiChevronRight, FiGrid,
  FiHome, FiLogOut, FiMenu, FiShoppingBag, FiStar, FiUsers
} from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import './Admin.css'

const SIDEBAR_LINKS = [
  { to: '/admin',           Icon: FiGrid,        label: 'Dashboard', end: true },
  { to: '/admin/books',     Icon: FiBook,        label: 'Books'     },
  { to: '/admin/orders',    Icon: FiShoppingBag, label: 'Orders'    },
  { to: '/admin/users',     Icon: FiUsers,       label: 'Users'     },
  { to: '/admin/reviews',   Icon: FiStar,        label: 'Reviews'   },
  { to: '/admin/analytics', Icon: FiBarChart2,   label: 'Analytics' }
]

function AdminSidebar({ collapsed, setCollapsed }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        {!collapsed && <span>BookNest<span style={{ color: 'var(--amber)' }}>Admin</span></span>}
        <button
          type="button"
          className="collapse-btn"
          onClick={() => setCollapsed((c) => !c)}
          aria-label="Toggle sidebar"
        >
          <FiMenu size={18} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {SIDEBAR_LINKS.map((l) => {
          const active = l.end
            ? location.pathname === l.to
            : location.pathname.startsWith(l.to)
          return (
            <Link
              key={l.to}
              to={l.to}
              className={`sidebar-link ${active ? 'active' : ''}`}
              title={l.label}
            >
              <l.Icon size={18} />
              {!collapsed && <span>{l.label}</span>}
              {!collapsed && active && (
                <FiChevronRight size={13} style={{ marginLeft: 'auto' }} />
              )}
            </Link>
          )
        })}
      </nav>

      <Link
        to="/"
        className="sidebar-user-view"
        title="Switch to User View"
      >
        <FiHome size={18} />
        {!collapsed && <span>User Dashboard</span>}
      </Link>

      <button
        type="button"
        className="sidebar-logout"
        onClick={handleLogout}
        title="Logout"
      >
        <FiLogOut size={18} />
        {!collapsed && <span>Logout</span>}
      </button>
    </aside>
  )
}

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className="admin-layout">
      <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
