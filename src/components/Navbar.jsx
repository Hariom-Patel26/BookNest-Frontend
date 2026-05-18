import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiSearch, FiShoppingCart, FiBell, FiUser, FiMenu, FiX,
  FiLogOut, FiPackage, FiHeart, FiCreditCard,
  FiBook, FiShield, FiChevronDown
} from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { MysteryBoxNavButton } from './MysteryBox'
import { bookService, notificationService } from '../services'
import './Navbar.css'

const NAV_LINKS = [
  { to: '/books',              label: 'Browse' },
  { to: '/books/featured',     label: 'Featured' },
  { to: '/books/new-arrivals', label: 'New Arrivals' }
]

export default function Navbar() {
  const { user, isLoggedIn, isAdmin, logout } = useAuth()
  const { itemCount } = useCart()
  const navigate = useNavigate()
  const location = useLocation()

  const [mobileOpen, setMobileOpen]   = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSugg, setShowSugg]       = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const searchRef   = useRef(null)
  const profileRef  = useRef(null)
  const debounceRef = useRef(null)

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false)
    setProfileOpen(false)
    setShowSugg(false)
  }, [location])

  // Lock body scroll while mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  // Fetch unread notification count
  useEffect(() => {
    if (!user?.userId) { setUnreadCount(0); return }
    notificationService.getUnreadCount(user.userId)
      .then((r) => setUnreadCount(r.data?.unreadCount ?? 0))
      .catch(() => {})
  }, [user, location])

  // Click-outside handlers
  useEffect(() => {
    const onClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
      if (searchRef.current && !searchRef.current.contains(e.target))   setShowSugg(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  // ─── Search autocomplete (debounced) ─────────────────────────────────────
  const handleSearchInput = (e) => {
    const val = e.target.value
    setSearchQuery(val)
    clearTimeout(debounceRef.current)
    if (val.trim().length < 2) {
      setSuggestions([]); setShowSugg(false); return
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await bookService.autocomplete(val)
        setSuggestions((res.data ?? []).slice(0, 6))
        setShowSugg(true)
      } catch {
        setSuggestions([]); setShowSugg(false)
      }
    }, 220)
  }

  const handleSearch = (e) => {
    e?.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?keyword=${encodeURIComponent(searchQuery.trim())}`)
      setShowSugg(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        {/* Brand */}
        <Link to="/" className="navbar-brand">
          <FiBook size={22} />
          <span className="brand-text">BookNest</span>
        </Link>

        {/* Desktop links */}
        <div className="navbar-links">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`nav-link${location.pathname === l.to ? ' active' : ''}`}
            >
              {l.label}
            </Link>
          ))}
          <MysteryBoxNavButton />
        </div>

        {/* Search */}
        <div className="navbar-search" ref={searchRef}>
          <form onSubmit={handleSearch} className="search-form" role="search">
            <FiSearch className="search-icon" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInput}
              placeholder="Search books, authors…"
              className="search-input"
              onFocus={() => suggestions.length > 0 && setShowSugg(true)}
              aria-label="Search books"
            />
          </form>
          <AnimatePresence>
            {showSugg && suggestions.length > 0 && (
              <motion.div
                className="search-dropdown"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                {suggestions.map((b, i) => (
                  <Link
                    key={b.id ?? b.bookId ?? i}
                    to={`/books/${b.id ?? b.bookId}`}
                    className="search-suggestion"
                    onClick={() => { setShowSugg(false); setSearchQuery('') }}
                  >
                    <div className="sugg-title">{b.title}</div>
                    <div className="sugg-meta">{b.author} · {b.genre}</div>
                  </Link>
                ))}
                <button type="button" className="search-see-all" onClick={handleSearch}>
                  See all results for "{searchQuery}"
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right actions */}
        <div className="navbar-actions">
          <Link to="/cart" className="action-btn" aria-label="Cart">
            <FiShoppingCart size={20} />
            {itemCount > 0 && <span className="badge-count">{itemCount}</span>}
          </Link>

          {isLoggedIn ? (
            <>
              <Link to="/notifications" className="action-btn" aria-label="Notifications">
                <FiBell size={20} />
                {unreadCount > 0 && <span className="badge-count">{unreadCount}</span>}
              </Link>

              <div className="profile-menu" ref={profileRef}>
                <button
                  type="button"
                  className="profile-trigger"
                  onClick={() => setProfileOpen((p) => !p)}
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                >
                  <div className="avatar">{user?.fullName?.[0]?.toUpperCase() ?? '?'}</div>
                  <span className="profile-name">{user?.fullName?.split(' ')[0]}</span>
                  <FiChevronDown size={14} className={profileOpen ? 'chevron open' : 'chevron'} />
                </button>
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      className="profile-dropdown"
                      initial={{ opacity: 0, scale: 0.95, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -8 }}
                      transition={{ duration: 0.15 }}
                      role="menu"
                    >
                      <div className="dropdown-header">
                        <div className="dh-name">{user?.fullName}</div>
                        <div className="dh-email">{user?.email}</div>
                        {isAdmin && (
                          <span className="badge badge-amber" style={{ marginTop: 6 }}>Admin</span>
                        )}
                      </div>
                      <div className="dropdown-divider" />
                      <Link to="/profile"  className="dropdown-item"><FiUser size={15} /> Profile</Link>
                      <Link to="/orders"   className="dropdown-item"><FiPackage size={15} /> My Orders</Link>
                      <Link to="/wallet"   className="dropdown-item"><FiCreditCard size={15} /> Wallet</Link>
                      <Link to="/wishlist" className="dropdown-item"><FiHeart size={15} /> Wishlist</Link>
                      {isAdmin && (
                        <>
                          <div className="dropdown-divider" />
                          <Link to="/admin" className="dropdown-item admin-link">
                            <FiShield size={15} /> Admin Panel
                          </Link>
                        </>
                      )}
                      <div className="dropdown-divider" />
                      <button type="button" className="dropdown-item logout-item" onClick={handleLogout}>
                        <FiLogOut size={15} /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="auth-btns">
              <Link to="/login"    className="btn btn-ghost btn-sm">Login</Link>
              <Link to="/register" className="btn btn-amber btn-sm">Register</Link>
            </div>
          )}

          <button
            type="button"
            className="hamburger"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
          >
            <div className="mobile-search">
              <form onSubmit={handleSearch} className="search-form">
                <FiSearch className="search-icon" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInput}
                  placeholder="Search…"
                  className="search-input"
                />
              </form>
            </div>
            <div className="mobile-links">
              {NAV_LINKS.map((l) => (
                <Link key={l.to} to={l.to} className="mobile-link">{l.label}</Link>
              ))}
              <MysteryBoxNavButton />
              <div className="mobile-divider" />
              {isLoggedIn ? (
                <>
                  <Link to="/profile"       className="mobile-link"><FiUser size={15} /> Profile</Link>
                  <Link to="/orders"        className="mobile-link"><FiPackage size={15} /> Orders</Link>
                  <Link to="/cart"          className="mobile-link"><FiShoppingCart size={15} /> Cart {itemCount > 0 && `(${itemCount})`}</Link>
                  <Link to="/wallet"        className="mobile-link"><FiCreditCard size={15} /> Wallet</Link>
                  <Link to="/wishlist"      className="mobile-link"><FiHeart size={15} /> Wishlist</Link>
                  <Link to="/notifications" className="mobile-link"><FiBell size={15} /> Notifications</Link>
                  {isAdmin && (
                    <Link to="/admin" className="mobile-link admin-link">
                      <FiShield size={15} /> Admin Panel
                    </Link>
                  )}
                  <button type="button" className="mobile-link logout-btn" onClick={handleLogout}>
                    <FiLogOut size={15} /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login"    className="mobile-link">Login</Link>
                  <Link to="/register" className="mobile-link">Register</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
