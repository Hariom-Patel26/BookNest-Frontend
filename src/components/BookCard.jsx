import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiShoppingCart, FiHeart, FiStar } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { wishlistService, getErrorMessage } from '../services'
import './BookCard.css'

const PLACEHOLDER = 'https://cdn-icons-png.flaticon.com/512/2702/2702172.png'

export default function BookCard({ book }) {
  const { isLoggedIn, user } = useAuth()
  const { addToCart }        = useCart()
  const [wishlisted, setWishlisted] = useState(false)
  const [adding, setAdding]         = useState(false)
  const [imgSrc, setImgSrc]         = useState(book.coverImageUrl || PLACEHOLDER)

  const isFallback = imgSrc === PLACEHOLDER

  const bookId = book.bookId ?? book.id

  const handleAddToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isLoggedIn) { toast.error('Please log in to add to cart'); return }
    if (book.stock === 0) { toast.error('Out of stock'); return }
    setAdding(true)
    try {
      await addToCart(book, 1)
      toast.success(`"${book.title}" added to cart`)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to add to cart'))
    } finally {
      setAdding(false)
    }
  }

  const handleWishlist = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isLoggedIn) { toast.error('Please log in first'); return }
    try {
      await wishlistService.addBook(user.userId, {
        bookId, bookTitle: book.title, bookPrice: book.price
      })
      setWishlisted(true)
      toast.success('Added to wishlist')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Already in wishlist'))
    }
  }

  const stars = Math.round(book.rating || 0)

  return (
    <motion.div
      className="book-card-wrapper"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link to={`/books/${bookId}`} className="book-card">
        <div className="book-card-image-wrap">
          <img
            src={imgSrc}
            alt={book.title}
            className={`book-card-image ${isFallback ? 'fallback-img' : ''}`}
            loading="lazy"
            onError={() => setImgSrc(PLACEHOLDER)}
          />
          <div className="book-card-overlay">
            <button
              type="button"
              className={`overlay-btn wishlist-btn ${wishlisted ? 'wished' : ''}`}
              onClick={handleWishlist}
              aria-label="Add to wishlist"
              title="Add to wishlist"
            >
              <FiHeart size={16} fill={wishlisted ? 'currentColor' : 'none'} />
            </button>
          </div>
          {book.featured && <span className="badge-featured">Featured</span>}
          {book.stock === 0 && <span className="badge-oos">Out of Stock</span>}
        </div>
        <div className="book-card-body">
          <div className="book-genre">{book.genre || 'General'}</div>
          <h3 className="book-title">{book.title}</h3>
          <p className="book-author">by {book.author}</p>
          <div className="book-stars">
            {[1, 2, 3, 4, 5].map((i) => (
              <FiStar
                key={i}
                size={12}
                fill={i <= stars ? 'var(--amber)' : 'none'}
                color={i <= stars ? 'var(--amber)' : 'var(--gray-300)'}
              />
            ))}
            <span className="book-rating-text">{book.rating?.toFixed(1) || '—'}</span>
          </div>
          <div className="book-card-footer">
            <span className="book-price">₹{book.price?.toFixed(2)}</span>
            <button
              type="button"
              className="btn btn-amber btn-sm add-cart-btn"
              onClick={handleAddToCart}
              disabled={adding || book.stock === 0}
              aria-label={`Add ${book.title} to cart`}
            >
              <FiShoppingCart size={14} />
              {adding ? '…' : 'Add'}
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
