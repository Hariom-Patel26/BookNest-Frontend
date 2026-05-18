import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FiArrowRight, FiBook, FiShoppingBag, FiStar, FiUsers
} from 'react-icons/fi'
import BookCard from '../components/BookCard'
import { SkeletonCard } from '../components/ui/index.jsx'
import { MysteryBoxHomeSection } from '../components/MysteryBox'
import { bookService } from '../services'
import floatingBooksImage from '../assets/booknest_Image.png'
import './Home.css'

const GENRES = ['Fiction', 'Technology', 'Science', 'History', 'Biography', 'Mystery', 'Fantasy', 'Programming']

export default function Home() {
  const [featured, setFeatured]       = useState([])
  const [newArrivals, setNewArrivals] = useState([])
  const [topRated, setTopRated]       = useState([])
  const [loading, setLoading]         = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    Promise.allSettled([
      bookService.getFeatured(),
      bookService.getNewArrivals(),
      bookService.getTopRated()
    ]).then((results) => {
      if (cancelled) return
      const [f, n, t] = results
      setFeatured(f.status === 'fulfilled' ? (f.value.data ?? []).slice(0, 4) : [])
      setNewArrivals(n.status === 'fulfilled' ? (n.value.data ?? []).slice(0, 8) : [])
      setTopRated(t.status === 'fulfilled' ? (t.value.data ?? []).slice(0, 4) : [])
    }).finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [])


  const container = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }
  const item      = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

  return (
    <div className="home page-enter">
      {/* ─── Hero ─── */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="container hero-content">
          <motion.div
            className="hero-text"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="hero-eyebrow">
              <span className="eyebrow-dot" /> Discover · Read · Belong
            </div>
            <h1 className="hero-title">
              Your Next Great<br />
              <em>Adventure</em> Awaits
            </h1>
            <p className="hero-sub">
              Explore thousands of books across every genre. Find your perfect read,
              support great authors, and build your personal library.
            </p>

            <div className="hero-stats">
              {[
                { Icon: FiBook,        val: '10,000+', label: 'Books' },
                { Icon: FiUsers,       val: '50,000+', label: 'Readers' },
                { Icon: FiStar,        val: '4.8★',    label: 'Avg Rating' },
                { Icon: FiShoppingBag, val: 'Free',    label: 'Delivery 499+' }
              ].map(({ Icon, val, label }) => (
                <div key={label} className="hero-stat">
                  <Icon size={18} color="var(--amber)" />
                  <div>
                    <div className="stat-val">{val}</div>
                    <div className="stat-label">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="hero-visual"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="book-stack">
              <img src={floatingBooksImage} alt="Floating Books Composition" className="floating-books-img" />
            </div>
          </motion.div>
        </div>
      </section>

      <MysteryBoxHomeSection />

      {/* ─── Genre pills ─── */}
      <section className="genres-section">
        <div className="container">
          <div className="genres-scroll">
            {GENRES.map((g) => (
              <Link key={g} to={`/books/genre/${g}`} className="genre-pill">{g}</Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured ─── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <div className="section-eyebrow">Hand-picked for you</div>
              <h2 className="section-title">Featured Books</h2>
            </div>
            <Link to="/books/featured" className="btn btn-outline btn-sm">
              View All <FiArrowRight size={14} />
            </Link>
          </div>
          <motion.div className="books-grid" variants={container} initial="hidden" animate="visible">
            {loading
              ? Array(4).fill(0).map((_, i) => <div key={i}><SkeletonCard /></div>)
              : featured.map((b) => (
                  <motion.div key={b.bookId} variants={item}>
                    <BookCard book={b} />
                  </motion.div>
                ))}
            {!loading && featured.length === 0 && (
              <p className="text-muted" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>
                No featured books available yet.
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* ─── Promo banner ─── */}
      <section className="promo-banner">
        <div className="container promo-inner">
          <div>
            <h2 style={{ color: '#fff', marginBottom: '0.5rem' }}>Start Your E-Wallet Today</h2>
            <p style={{ color: 'rgba(255,255,255,.75)', maxWidth: 480 }}>
              Top up your BookNest wallet and pay instantly at checkout. Faster, simpler, smarter.
            </p>
          </div>
          <Link to="/wallet" className="btn btn-amber btn-lg">Set Up Wallet →</Link>
        </div>
      </section>

      {/* ─── New Arrivals ─── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <div className="section-eyebrow">Fresh from the press</div>
              <h2 className="section-title">New Arrivals</h2>
            </div>
            <Link to="/books/new-arrivals" className="btn btn-outline btn-sm">
              View All <FiArrowRight size={14} />
            </Link>
          </div>
          <motion.div className="books-grid" variants={container} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            {loading
              ? Array(8).fill(0).map((_, i) => <div key={i}><SkeletonCard /></div>)
              : newArrivals.map((b) => (
                  <motion.div key={b.bookId} variants={item}>
                    <BookCard book={b} />
                  </motion.div>
                ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Top Rated ─── */}
      {topRated.length > 0 && (
        <section className="section section-cream">
          <div className="container">
            <div className="section-header">
              <div>
                <div className="section-eyebrow">Critically acclaimed</div>
                <h2 className="section-title">Top Rated</h2>
              </div>
              <Link to="/search?minRating=4" className="btn btn-outline btn-sm">
                View All <FiArrowRight size={14} />
              </Link>
            </div>
            <div className="top-rated-list">
              {topRated.map((b, i) => (
                <Link key={b.bookId} to={`/books/${b.bookId}`} className="top-rated-item">
                  <span className="rank">#{i + 1}</span>
                  <img
                    src={b.coverImageUrl || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=60&h=80&fit=crop'}
                    alt={b.title}
                    className="rank-cover"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=60&h=80&fit=crop' }}
                  />
                  <div className="rank-info">
                    <div className="rank-title">{b.title}</div>
                    <div className="rank-author">{b.author}</div>
                  </div>
                  <div className="rank-right">
                    <div className="rank-rating"><FiStar size={13} fill="var(--amber)" color="var(--amber)" /> {b.rating?.toFixed(1)}</div>
                    <div className="rank-price">₹{b.price?.toFixed(2)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
