import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiHeart, FiTrash2 } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { wishlistService, cartService, getErrorMessage } from '../services'
import { PageLoader, EmptyState } from '../components/ui/index.jsx'
import './Account.css'

export default function Wishlist() {
  const { user } = useAuth()
  const { fetchCart } = useCart()
  const [wishlist, setWishlist] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [removing, setRemoving] = useState(null)

  const fetchWishlist = useCallback(() => {
    if (!user?.userId) return
    setLoading(true)
    wishlistService.getWishlist(user.userId)
      .then((r) => setWishlist(r.data))
      .catch((err) => {
        if (err.response?.status !== 404) {
          toast.error(getErrorMessage(err, 'Failed to load wishlist'))
        }
        setWishlist(null)
      })
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => { fetchWishlist() }, [fetchWishlist])

  const handleRemove = async (bookId) => {
    setRemoving(bookId)
    try {
      await wishlistService.removeBook(user.userId, bookId)
      fetchWishlist()
      toast.success('Removed from wishlist')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to remove'))
    } finally {
      setRemoving(null)
    }
  }

  const handleMoveToCart = async (item) => {
    try {
      // 1. Add to cart first
      await cartService.addItem(user.userId, {
        bookId: item.bookId,
        bookTitle: item.bookTitle,
        price: item.bookPrice,
        quantity: 1
      })
      
      // 2. Remove from wishlist
      await wishlistService.moveToCart(user.userId, item.bookId)
      
      // 3. Refresh states
      await fetchCart()
      fetchWishlist()
      toast.success('Moved to cart!')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to move to cart'))
    }
  }

  if (loading) return <PageLoader />

  const books = wishlist?.books ?? []

  return (
    <div className="account-page page-enter">
      <div className="container-narrow">
        <h2 className="account-heading"><FiHeart /> My Wishlist</h2>

        {books.length === 0 ? (
          <EmptyState
            icon="💝"
            title="Your wishlist is empty"
            description="Save books you love for later."
            action={<Link to="/books" className="btn btn-primary mt-4">Browse Books</Link>}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {books.map((item) => (
              <div key={item.itemId} className="account-card wishlist-item">
                <div className="wishlist-thumb">{item.bookTitle?.[0]}</div>
                <div className="wishlist-info">
                  <div className="wishlist-title">{item.bookTitle}</div>
                  <div className="wishlist-price">₹{item.bookPrice?.toFixed(2)}</div>
                </div>
                <div className="wishlist-actions">
                  <Link to={`/books/${item.bookId}`} className="btn btn-outline btn-sm">
                    View
                  </Link>
                  <button
                    type="button"
                    className="btn btn-amber btn-sm"
                    onClick={() => handleMoveToCart(item)}
                  >
                    Move to Cart
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-icon"
                    onClick={() => handleRemove(item.bookId)}
                    disabled={removing === item.bookId}
                    aria-label="Remove from wishlist"
                  >
                    <FiTrash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
