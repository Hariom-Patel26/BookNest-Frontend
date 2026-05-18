import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { cartService, getErrorMessage } from '../services'
import './MysteryBox.css'

/**
 * Three preset boxes. Genre name MUST match the `genre` column in the
 * books table (Title case; backend is case-insensitive but echo is cleaner).
 */
const BOXES = [
  {
    genre:    'Educational',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
        <path d="M6 12.5V16a6 6 0 0 0 12 0v-3.5"/>
      </svg>
    ),
    tagline:  'Enhance your knowledge with 3 curated study reads',
    theme: {
      bg:          '#eef9f4',
      accent:      '#059669',
      accentLight: '#d1fae5',
      iconBg:      '#059669',
      gradient:    'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
      textDark:    '#064e3b',
      textMid:     '#065f46',
      priceBg:     '#ecfdf5',
      btnBg:       '#059669',
    }
  },
  {
    genre:    'Mixed',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
    tagline:  'A surprise blend of every genre in one amazing box',
    theme: {
      bg:          '#fdf4ff',
      accent:      '#9333ea',
      accentLight: '#f3e8ff',
      iconBg:      '#9333ea',
      gradient:    'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
      textDark:    '#3b0764',
      textMid:     '#581c87',
      priceBg:     '#faf5ff',
      btnBg:       '#9333ea',
    }
  },
  {
    genre:    'Fiction',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
    tagline:  'Experience 3 hand-picked fictional adventures',
    theme: {
      bg:          '#fff7ed',
      accent:      '#ea580c',
      accentLight: '#fed7aa',
      iconBg:      '#ea580c',
      gradient:    'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)',
      textDark:    '#431407',
      textMid:     '#7c2d12',
      priceBg:     '#fff7ed',
      btnBg:       '#ea580c',
    }
  }
]

const PRICE = 899

/* ─────────────────────────────────────────────────────────────────────────
   Individual genre card (used inside the modal)
───────────────────────────────────────────────────────────────────────── */
function MysteryBoxCard({ genre, icon, tagline, theme, onClose }) {
  const { user, isLoggedIn } = useAuth()
  const { fetchCart }        = useCart()
  const navigate             = useNavigate()
  const [busy, setBusy]      = useState(false)

  const handleAdd = async () => {
    if (!isLoggedIn) {
      toast.error('Please log in to add a Mystery Box')
      onClose()
      navigate('/login', { state: { from: { pathname: '/' } } })
      return
    }
    setBusy(true)
    try {
      await cartService.addMysteryBox(user.userId, genre)
      await fetchCart()
      toast.success(`${genre} Mystery Box added to your cart! 🎁`)
      onClose()
    } catch (err) {
      toast.error(getErrorMessage(err, `Couldn't add the ${genre} box`))
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      className="mb-card"
      style={{ background: theme.bg, borderTop: `4px solid ${theme.accent}` }}>

      {/* Decorative blob */}
      <div className="mb-card-blob" style={{ background: theme.gradient }} />

      <div className="mb-card-icon" style={{ background: theme.accentLight }}>
        <span style={{ color: theme.accent }}>{icon}</span>
      </div>
      <h3 className="mb-card-title" style={{ color: theme.textDark }}>{genre} Mystery Box</h3>
      <p className="mb-card-tag" style={{ color: theme.textMid }}>{tagline}</p>

      <ul className="mb-card-features" style={{ color: theme.textMid }}>
        <li>
          <span className="feat-badge" style={{ background: theme.accentLight, color: theme.accent }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="feat-icon"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          </span>
          3 surprise books inside
        </li>
        <li>
          <span className="feat-badge" style={{ background: theme.accentLight, color: theme.accent }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="feat-icon"><circle cx="12" cy="12" r="10"></circle><line x1="22" y1="12" x2="18" y2="12"></line><line x1="6" y1="12" x2="2" y2="12"></line><line x1="12" y1="6" x2="12" y2="2"></line><line x1="12" y1="22" x2="12" y2="18"></line></svg>
          </span>
          {genre === 'Mixed' ? 'Books from all genres' : `All from the ${genre} genre`}
        </li>
        <li>
          <span className="feat-badge" style={{ background: theme.accentLight, color: theme.accent }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="feat-icon"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </span>
          Reveal on delivery
        </li>
      </ul>

      <div className="mb-card-price" style={{ color: theme.textDark }}>₹{PRICE}</div>

      <button
        type="button"
        className="mb-card-btn"
        style={{ 
          background: theme.accentLight, 
          color: theme.accent,
          borderColor: theme.accentLight
        }}
        onClick={handleAdd}
        disabled={busy}>
        {busy ? 'Adding…' : 'Add to Cart'}
      </button>
    </motion.div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Shared modal — opened by BOTH the navbar button AND the home section
───────────────────────────────────────────────────────────────────────── */
function MysteryBoxModal({ onClose }) {
  return createPortal(
    <div className="mb-overlay" onClick={onClose}>
      <AnimatePresence>
        <motion.div
          key="mb-modal"
          className="mb-modal"
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          onClick={(e) => e.stopPropagation()}>

          <div className="mb-modal-header">
            <div>
              <span className="mb-eyebrow">✨ EXCLUSIVE</span>
              <h2 className="mb-modal-title">Mystery Boxes</h2>
              <p className="mb-modal-sub">
                Pick a genre · Get 3 surprise books · One flat price · Unbox on delivery.
              </p>
            </div>
            <button className="mb-close-btn" onClick={onClose} aria-label="Close">✕</button>
          </div>

          <div className="mb-grid">
            {BOXES.map((b) => (
              <MysteryBoxCard key={b.genre} {...b} onClose={onClose} />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   NAVBAR BUTTON
   → import { MysteryBoxNavButton } from '../components/MysteryBox'
   → Place inside your Navbar / Header component
───────────────────────────────────────────────────────────────────────── */
export function MysteryBoxNavButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className="nav-link mb-nav-link"
        onClick={() => setOpen(true)}>
        Mystery Box
      </button>

      {open && <MysteryBoxModal onClose={() => setOpen(false)} />}
    </>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   HOME PAGE SECTION  (Kitabay-style banner, orangeish theme)
   → import { MysteryBoxHomeSection } from '../components/MysteryBox'
   → Place in Home.jsx after the hero, before Featured Books
   → Clicking "Shop Now" opens the SAME modal as the navbar button
───────────────────────────────────────────────────────────────────────── */
export function MysteryBoxHomeSection() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <section className="mbs-section">
        <div className="container mbs-outer">

          {/* ── Section heading above the banner ─── */}
          <h2 className="mbs-heading">
            Mystery Boxes by <span className="mbs-brand">BookNest</span>
          </h2>

          {/* ── Pink banner ─── */}
          <div className="mbs-banner">

            {/* Left: bullet-point features */}
            <div className="mbs-copy">
              <div className="mbs-bullets">
                <ul>
                  <li>Available in 3 Genres</li>
                  <li>100% Original Books</li>
                  <li>Curated by book lovers</li>
                </ul>
                <ul>
                  <li>Free Bookmarks included</li>
                  <li>Up to 60% discount</li>
                  <li>Free Doorstep Delivery</li>
                </ul>
              </div>

              <p className="mbs-price-line">
                Starting at <strong>₹{PRICE}</strong> for 3 Books
              </p>

              <motion.button
                type="button"
                className="mbs-cta"
                onClick={() => setOpen(true)}
                whileHover={{ scale: 1.05, boxShadow: '0 8px 24px rgba(190,24,93,0.35)' }}
                whileTap={{ scale: 0.97 }}>
                Shop Now
              </motion.button>
            </div>

            {/* Right: animated CSS gift box */}
            <div className="mbs-art" aria-hidden="true">
              <motion.div
                className="mbs-box-wrap"
                animate={{ y: [0, -12, 0] }}
                transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}>

                {/* Lid */}
                <div className="mbs-lid">
                  <div className="mbs-lid-ribbon-v" />
                  <div className="mbs-lid-ribbon-h" />
                  {/* Bow */}
                  <div className="mbs-bow">
                    <div className="mbs-bow-left"  />
                    <div className="mbs-bow-right" />
                    <div className="mbs-bow-knot"  />
                  </div>
                </div>

                {/* Body */}
                <div className="mbs-body">
                  <div className="mbs-body-ribbon-v" />
                  <span className="mbs-body-label">MYSTERY<br />BOX</span>
                </div>

                {/* Floating sparkles */}
                <span className="mbs-star s1">✦</span>
                <span className="mbs-star s2">✦</span>
                <span className="mbs-star s3">✦</span>
                <span className="mbs-star s4">✦</span>
              </motion.div>
            </div>

          </div>{/* /mbs-banner */}
        </div>
      </section>

      {/* Same modal as the navbar button */}
      {open && <MysteryBoxModal onClose={() => setOpen(false)} />}
    </>
  )
}

/* Default export kept for any existing import */
export default MysteryBoxNavButton
