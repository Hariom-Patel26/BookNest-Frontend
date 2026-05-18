import { useCallback, useEffect, useState } from 'react'
import { FiTrash2 } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { reviewService, getErrorMessage } from '../../services'

export default function AdminReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(() => {
    setLoading(true)
    reviewService.getAll()
      .then((r) => {
        const sorted = (r.data ?? []).sort((a, b) => b.reviewId - a.reviewId)
        setReviews(sorted)
      })
      .catch(() => setReviews([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this review?')) return
    try {
      await reviewService.deleteReview(id)
      toast.success('Review removed')
      fetchAll()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Delete failed'))
    }
  }

  return (
    <div className="admin-page page-enter">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Reviews</h2>
      </div>
      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th><th>Book</th><th>User</th><th>Rating</th>
                <th>Comment</th><th>Date</th><th></th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7}><div className="skeleton" style={{ height: 20 }} /></td>
                    </tr>
                  ))
                : reviews.map((r) => (
                    <tr key={r.reviewId}>
                      <td className="fw-600">#{r.reviewId}</td>
                      <td>{r.bookId}</td>
                      <td>{r.userId}</td>
                      <td className="text-amber fw-600">{'★'.repeat(r.rating)}</td>
                      <td style={{
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {r.comment}
                      </td>
                      <td>{r.reviewDate}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm btn-icon"
                          onClick={() => handleDelete(r.reviewId)}
                          aria-label="Delete review"
                          style={{ color: 'var(--danger)' }}
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
              {!loading && reviews.length === 0 && (
                <tr><td colSpan={7} className="empty-row">No reviews yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
