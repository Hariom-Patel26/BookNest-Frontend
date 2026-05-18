import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  FiChevronLeft, FiHeart, FiShoppingCart, FiStar
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import BookCard from '../components/BookCard'
import { PageLoader, SkeletonCard, StarRating, EmptyState } from '../components/ui/index.jsx'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { bookService, reviewService, wishlistService, getErrorMessage } from '../services'
import './Books.css'

const PLACEHOLDER = 'https://cdn-icons-png.flaticon.com/512/2702/2702172.png'

const GENRES = ['Fiction', 'Non-Fiction', 'Science', 'Technology', 'History', 'Biography', 'Mystery', 'Fantasy', 'Programming']

// ─── Catalog ─────────────────────────────────────────────────────────────────
export function BookCatalog({ type }) {
  const { genre } = useParams()
  const [books, setBooks]                 = useState([])
  const [loading, setLoading]             = useState(true)
  const [selectedGenre, setSelectedGenre] = useState(genre ?? '')
  const [sort, setSort]                   = useState('default')

  // Sync selectedGenre when URL changes
  useEffect(() => { setSelectedGenre(genre ?? '') }, [genre])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const fetcher = () => {
      if (type === 'featured')     return bookService.getFeatured()
      if (type === 'new-arrivals') return bookService.getNewArrivals()
      if (selectedGenre)           return bookService.getByGenre(selectedGenre)
      return bookService.getAll()
    }
    fetcher()
      .then((r) => { if (!cancelled) setBooks(r.data ?? []) })
      .catch(() => { if (!cancelled) setBooks([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [selectedGenre, type])

  const sorted = useMemo(() => {
    const copy = [...books]
    switch (sort) {
      case 'price-asc':  return copy.sort((a, b) => a.price - b.price)
      case 'price-desc': return copy.sort((a, b) => b.price - a.price)
      case 'rating':     return copy.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      case 'title':      return copy.sort((a, b) => a.title.localeCompare(b.title))
      default:           return copy
    }
  }, [books, sort])

  const title =
    type === 'featured'     ? 'Featured Books' :
    type === 'new-arrivals' ? 'New Arrivals'   :
    selectedGenre           ? `${selectedGenre} Books` :
                              'All Books'

  return (
    <div className="catalog-page page-enter">
      <div className="catalog-header">
        <div className="container">
          <h1 className="catalog-title">{title}</h1>
          <p className="text-muted" style={{ color: 'rgba(255,255,255,.7)' }}>
            {loading ? 'Loading…' : `${books.length} books`}
          </p>
        </div>
      </div>

      <div className={`container catalog-body ${type ? 'no-sidebar' : ''}`}>
        {!type && (
          <aside className="catalog-sidebar">
          <div className="filter-card">
            <h4 className="filter-heading">Genre</h4>
            <button
              type="button"
              className={`genre-filter-btn ${!selectedGenre ? 'active' : ''}`}
              onClick={() => setSelectedGenre('')}
            >
              All Genres
            </button>
            {GENRES.map((g) => (
              <button
                key={g}
                type="button"
                className={`genre-filter-btn ${selectedGenre === g ? 'active' : ''}`}
                onClick={() => setSelectedGenre(g)}
              >
                {g}
              </button>
            ))}
          </div>
          </aside>
        )}

        <main className="catalog-main">
          <div className="catalog-toolbar">
            <span className="text-muted">{sorted.length} results</span>
            <select
              className="form-control sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sort books"
            >
              <option value="default">Sort: Default</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="title">Title A–Z</option>
            </select>
          </div>

          <div className="catalog-grid">
            {loading
              ? Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)
              : sorted.map((b) => <BookCard key={b.bookId} book={b} />)}
            {!loading && sorted.length === 0 && (
              <EmptyState
                gridSpan
                icon="📚"
                title="No books found"
                description="Try a different genre or filter."
              />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

// ─── Book detail ─────────────────────────────────────────────────────────────
export function BookDetail() {
  const { id } = useParams()
  const { user, isLoggedIn } = useAuth()
  const { addToCart }        = useCart()
  const navigate = useNavigate()

  const [book, setBook]             = useState(null)
  const [reviews, setReviews]       = useState([])
  const [avgRating, setAvgRating]   = useState(0)
  const [similar, setSimilar]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [submitting, setSubmitting] = useState(false)
  const [adding, setAdding]         = useState(false)
  const [imgSrc, setImgSrc]         = useState(null)

  const isFallback = imgSrc === PLACEHOLDER

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.allSettled([
      bookService.getById(id),
      reviewService.getByBook(id),
      reviewService.getAvgRating(id),
      bookService.getSimilar(id)
    ]).then(([b, r, avg, sim]) => {
      if (cancelled) return
      const fetchedBook = b.status === 'fulfilled' ? b.value.data : null
      setBook(fetchedBook)
      setImgSrc(fetchedBook?.coverImageUrl || PLACEHOLDER)
      setReviews(r.status === 'fulfilled' ? (r.value.data ?? []) : [])
      setAvgRating(avg.status === 'fulfilled' ? (avg.value.data?.avgRating ?? 0) : 0)
      setSimilar(sim.status === 'fulfilled' ? (sim.value.data ?? []).slice(0, 4) : [])
    }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  const handleAddToCart = async () => {
    if (!isLoggedIn) { toast.error('Please log in first'); return }
    if (book.stock === 0) { toast.error('Out of stock'); return }
    setAdding(true)
    try {
      await addToCart(book, 1)
      toast.success('Added to cart!')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to add to cart'))
    } finally {
      setAdding(false)
    }
  }

  const handleWishlist = async () => {
    if (!isLoggedIn) { toast.error('Please log in first'); return }
    try {
      await wishlistService.addBook(user.userId, {
        bookId: book.bookId, bookTitle: book.title, bookPrice: book.price
      })
      toast.success('Added to wishlist')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Already in wishlist'))
    }
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!isLoggedIn) { toast.error('Please log in to review'); return }
    setSubmitting(true)
    try {
      await reviewService.addReview({
        bookId: parseInt(id), userId: user.userId,
        rating: reviewForm.rating, comment: reviewForm.comment.trim()
      })
      toast.success('Review submitted!')
      setReviewForm({ rating: 5, comment: '' })
      const [r, avg] = await Promise.all([
        reviewService.getByBook(id),
        reviewService.getAvgRating(id)
      ])
      setReviews(r.data ?? [])
      setAvgRating(avg.data?.avgRating ?? 0)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Already reviewed or submission failed'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <PageLoader />
  if (!book) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <h3>Book not found</h3>
        <Link to="/books" className="btn btn-primary mt-4">Browse Books</Link>
      </div>
    )
  }

  return (
    <div className="book-detail page-enter">
      <div className="container">
        <button type="button" className="back-btn" onClick={() => navigate(-1)}>
          <FiChevronLeft size={18} /> Back
        </button>

        <div className="detail-grid">
          <div className="detail-cover-wrap">
            <motion.img
              src={imgSrc}
              alt={book.title}
              className={`detail-cover ${isFallback ? 'fallback-img' : ''}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              onError={() => setImgSrc(PLACEHOLDER)}
            />
            {book.stock === 0 && <div className="detail-oos-badge">Out of Stock</div>}
          </div>

          <motion.div
            className="detail-info"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {book.genre && <span className="detail-genre">{book.genre}</span>}
            <h1 className="detail-title">{book.title}</h1>
            <p className="detail-author">by <strong>{book.author}</strong></p>

            <div className="detail-rating">
              <StarRating rating={avgRating} size={18} />
              <span className="rating-num">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</span>
              <span className="text-muted">({reviews.length} reviews)</span>
            </div>

            <div className="detail-price">₹{book.price?.toFixed(2)}</div>

            <div className="detail-meta">
              {[
                ['Publisher', book.publisher],
                ['ISBN', book.isbn],
                ['Genre', book.genre],
                ['Published', book.publishedDate],
                ['Pages', book.numberOfPages],
                ['Binding', book.bindingType],
                ['Delivery', book.expectedDeliveryTime],
                ['COD Available', book.codAvailable !== undefined ? (book.codAvailable ? 'Yes' : 'No') : null],
                ['In Stock', book.stock > 0 ? `${book.stock} copies` : 'Out of stock']
              ].filter(([, v]) => v !== null && v !== undefined && v !== '').map(([k, v]) => (
                <div key={k} className="meta-row">
                  <span className="meta-key">{k}</span>
                  <span className="meta-val">{v}</span>
                </div>
              ))}
            </div>

            <div className="detail-actions">
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={handleAddToCart}
                disabled={adding || book.stock === 0}
              >
                <FiShoppingCart size={18} />
                {adding ? 'Adding…' : book.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button
                type="button"
                className="btn btn-outline btn-lg btn-icon"
                onClick={handleWishlist}
                aria-label="Add to wishlist"
                title="Add to wishlist"
              >
                <FiHeart size={18} />
              </button>
            </div>

            {book.description && (
              <div className="detail-desc">
                <h4>About this book</h4>
                <p>{book.description}</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Reviews */}
        <div className="reviews-section">
          <h3 className="reviews-title">Customer Reviews</h3>

          {isLoggedIn && (
            <form onSubmit={handleReviewSubmit} className="review-form-card">
              <h4>Write a Review</h4>
              <div className="form-group">
                <label className="form-label">Your Rating</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <FiStar
                      key={s}
                      size={24}
                      fill={s <= reviewForm.rating ? 'var(--amber)' : 'none'}
                      color={s <= reviewForm.rating ? 'var(--amber)' : 'var(--gray-300)'}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setReviewForm((f) => ({ ...f, rating: s }))}
                    />
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Comment</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Share your thoughts…"
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                />
              </div>
              <button type="submit" className="btn btn-amber" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit Review'}
              </button>
            </form>
          )}

          <div className="reviews-list">
            {reviews.map((r) => (
              <div key={r.reviewId} className="review-card">
                <div className="review-header">
                  <div className="reviewer-avatar">{r.userId}</div>
                  <div>
                    <StarRating rating={r.rating} size={14} />
                    <div className="review-date text-muted" style={{ fontSize: '0.75rem', marginTop: 2 }}>
                      {r.reviewDate}
                    </div>
                  </div>
                </div>
                {r.comment && <p className="review-comment">{r.comment}</p>}
              </div>
            ))}
            {reviews.length === 0 && (
              <p className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>
                No reviews yet. Be the first to review!
              </p>
            )}
          </div>
        </div>

        {/* Similar */}
        {similar.length > 0 && (
          <div className="similar-section">
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--navy)', fontFamily: 'var(--font-display)' }}>
              You May Also Like
            </h3>
            <div className="similar-grid">
              {similar.map((b) => (
                <BookCard key={b.id ?? b.bookId} book={{ ...b, bookId: b.id ?? b.bookId }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Search ──────────────────────────────────────────────────────────────────
export function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialKeyword = searchParams.get('keyword') ?? ''

  const [query, setQuery]         = useState(initialKeyword)
  const [genre, setGenre]         = useState(searchParams.get('genre') ?? '')
  const [minPrice, setMinPrice]   = useState(searchParams.get('minPrice') ?? '')
  const [maxPrice, setMaxPrice]   = useState(searchParams.get('maxPrice') ?? '')
  const [minRating, setMinRating] = useState(searchParams.get('minRating') ?? '')
  const [books, setBooks]         = useState([])
  const [loading, setLoading]     = useState(false)
  const [engine, setEngine]       = useState('')

  const doSearch = async (params) => {
    setLoading(true)
    try {
      const res = await bookService.advancedSearch({
        keyword:   params.query     || undefined,
        genre:     params.genre     || undefined,
        minPrice:  params.minPrice  || undefined,
        maxPrice:  params.maxPrice  || undefined,
        minRating: params.minRating || undefined
      })
      setBooks(res.data ?? [])
      setEngine('Elasticsearch')
    } catch {
      // Fallback to MySQL keyword search if Elasticsearch is down
      try {
        const res = await bookService.searchFallback(params.query || '')
        setBooks(res.data ?? [])
        setEngine('MySQL (fallback)')
      } catch {
        setBooks([])
        setEngine('')
      }
    } finally {
      setLoading(false)
    }
  }

  // Re-run when ANY URL search param changes
  useEffect(() => {
    if (initialKeyword || searchParams.get('genre') || searchParams.get('minPrice') || searchParams.get('minRating')) {
      doSearch({
        query:     initialKeyword,
        genre:     searchParams.get('genre') ?? '',
        minPrice:  searchParams.get('minPrice') ?? '',
        maxPrice:  searchParams.get('maxPrice') ?? '',
        minRating: searchParams.get('minRating') ?? ''
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleSubmit = (e) => {
    e.preventDefault()
    // Push state to URL so it's shareable / bookmarkable
    const params = {}
    if (query.trim()) params.keyword = query.trim()
    if (genre)        params.genre    = genre
    if (minPrice)     params.minPrice = minPrice
    if (maxPrice)     params.maxPrice = maxPrice
    if (minRating)    params.minRating = minRating
    setSearchParams(params)
  }

  return (
    <div className="search-page page-enter">
      <div className="search-hero">
        <div className="container">
          <h2 style={{ color: 'var(--white)', fontFamily: 'var(--font-display)', marginBottom: '1.5rem' }}>
            Search Books
          </h2>
          <form onSubmit={handleSubmit} className="search-filters">
            <div className="filter-row">
              <input
                className="form-control"
                placeholder="Title, author, genre, ISBN…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ flex: 2 }}
              />
              <select className="form-control" value={genre} onChange={(e) => setGenre(e.target.value)}>
                <option value="">All Genres</option>
                {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
              <input
                className="form-control" type="number" placeholder="Min ₹"
                value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
                style={{ width: 100 }} min={0}
              />
              <input
                className="form-control" type="number" placeholder="Max ₹"
                value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
                style={{ width: 100 }} min={0}
              />
              <select className="form-control" value={minRating} onChange={(e) => setMinRating(e.target.value)}>
                <option value="">Any Rating</option>
                <option value="4.5">★ 4.5+</option>
                <option value="4">★ 4.0+</option>
                <option value="3">★ 3.0+</option>
              </select>
              <button type="submit" className="btn btn-amber">Search</button>
            </div>
          </form>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem var(--space-6)' }}>
        {(books.length > 0 || loading) && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            <div>
              <span className="fw-600" style={{ color: 'var(--navy)' }}>{books.length} results</span>
              {query && <span className="text-muted"> for "{query}"</span>}
            </div>
            {engine && (
              <span className="badge badge-amber" style={{ fontSize: '0.7rem' }}>
                ⚡ {engine}
              </span>
            )}
          </div>
        )}

        <div className="catalog-grid">
          {loading
            ? Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)
            : books.map((b) => (
                <BookCard
                  key={b.bookId ?? b.id}
                  book={{ ...b, bookId: b.bookId ?? b.id }}
                />
              ))}
          {!loading && books.length === 0 && query && (
            <EmptyState
              gridSpan
              icon="🔍"
              title="No results found"
              description="Try different keywords or remove some filters."
            />
          )}
          {!loading && !query && books.length === 0 && (
            <EmptyState
              gridSpan
              icon="📚"
              title="Start your search"
              description="Enter a keyword, genre, or author to find books."
            />
          )}
        </div>
      </div>
    </div>
  )
}
