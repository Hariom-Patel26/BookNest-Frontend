import { useCallback, useEffect, useState } from 'react'
import { FiEdit2, FiPlus, FiRefreshCw, FiTrash2, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { bookService, getErrorMessage } from '../../services'

const EMPTY_FORM = {
  title: '', author: '', isbn: '', genre: '',
  publisher: '', price: '', stock: '',
  description: '', coverImageUrl: '', featured: false,
  numberOfPages: '', bindingType: '', codAvailable: true
}

const FORM_FIELDS = [
  { name: 'title',         label: 'Title *',         required: true                  },
  { name: 'author',        label: 'Author *',        required: true                  },
  { name: 'isbn',          label: 'ISBN'                                              },
  { name: 'genre',         label: 'Genre'                                             },
  { name: 'publisher',     label: 'Publisher'                                         },
  { name: 'price',         label: 'Price (₹) *',     required: true, type: 'number' },
  { name: 'stock',         label: 'Stock *',         required: true, type: 'number' },
  { name: 'publishedDate', label: 'Published Date',  type: 'date'                    },
  { name: 'coverImageUrl', label: 'Cover Image URL'                                   },
  { name: 'numberOfPages', label: 'Number of Pages', type: 'number'                   },
  { name: 'bindingType',   label: 'Binding Type'                                      }
]

export default function AdminBooks() {
  const [books, setBooks]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editBook, setEditBook] = useState(null)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)

  const fetchAll = useCallback(() => {
    setLoading(true)
    bookService.getAll()
      .then((r) => setBooks(r.data ?? []))
      .catch(() => setBooks([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ─── FIX: lock body scroll while modal is open ─────────────────────────
  useEffect(() => {
    document.body.style.overflow = showForm ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showForm])

  // ─── Close on Esc ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!showForm) return
    const onKey = (e) => { if (e.key === 'Escape') setShowForm(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [showForm])

  const openAdd = () => {
    setEditBook(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const openEdit = (b) => {
    setEditBook(b)
    setForm({
      title:         b.title ?? '',
      author:        b.author ?? '',
      isbn:          b.isbn ?? '',
      genre:         b.genre ?? '',
      publisher:     b.publisher ?? '',
      price:         b.price ?? '',
      stock:         b.stock ?? '',
      description:   b.description ?? '',
      coverImageUrl: b.coverImageUrl ?? '',
      publishedDate: b.publishedDate ?? '',
      featured:      !!b.featured,
      numberOfPages: b.numberOfPages ?? '',
      bindingType:   b.bindingType ?? '',
      codAvailable:  b.codAvailable !== false // defaults to true if undefined
    })
    setShowForm(true)
  }

  const handleField = (e) => {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        numberOfPages: form.numberOfPages ? Number(form.numberOfPages) : null
      }
      if (editBook) {
        await bookService.updateBook(editBook.bookId, payload)
        toast.success('Book updated')
      } else {
        await bookService.addBook(payload)
        toast.success('Book added')
      }
      setShowForm(false)
      fetchAll()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this book?')) return
    try {
      await bookService.deleteBook(id)
      toast.success('Deleted')
      fetchAll()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Delete failed'))
    }
  }

  const handleStockUpdate = async (id, stock) => {
    try {
      await bookService.updateStock(id, parseInt(stock, 10))
      fetchAll()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Stock update failed'))
    }
  }

  const handleReindex = async () => {
    try {
      await bookService.reindex()
      toast.success('Reindex triggered')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Reindex failed'))
    }
  }

  return (
    <div className="admin-page page-enter">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Books</h2>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleReindex}>
            <FiRefreshCw size={14} /> Reindex ES
          </button>
          <button type="button" className="btn btn-amber btn-sm" onClick={openAdd}>
            <FiPlus size={14} /> Add Book
          </button>
        </div>
      </div>

      {/* ─── FIXED Modal: overlay scrolls; align-start; body lock ─── */}
      {showForm && (
        <div
          className="modal-overlay"
          onClick={() => setShowForm(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="book-modal-title"
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4 id="book-modal-title">{editBook ? 'Edit Book' : 'Add New Book'}</h4>
              <button type="button" onClick={() => setShowForm(false)} aria-label="Close">
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSave} className="modal-form">
              <div className="modal-grid">
                {FORM_FIELDS.map((f) => (
                  <div key={f.name} className="form-group">
                    <label className="form-label" htmlFor={`book-${f.name}`}>{f.label}</label>
                    <input
                      id={`book-${f.name}`}
                      className="form-control"
                      type={f.type ?? 'text'}
                      required={f.required}
                      value={form[f.name]}
                      onChange={handleField}
                      name={f.name}
                    />
                  </div>
                ))}
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label" htmlFor="book-description">Description</label>
                  <textarea
                    id="book-description"
                    name="description"
                    className="form-control"
                    rows={3}
                    value={form.description}
                    onChange={handleField}
                  />
                </div>
                <div
                  className="form-group"
                  style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: '.5rem' }}
                >
                  <input
                    type="checkbox"
                    id="featured"
                    name="featured"
                    checked={form.featured}
                    onChange={handleField}
                  />
                  <label htmlFor="featured" className="form-label" style={{ margin: 0 }}>
                    Featured Book
                  </label>
                </div>
                <div
                  className="form-group"
                  style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: '.5rem' }}
                >
                  <input
                    type="checkbox"
                    id="codAvailable"
                    name="codAvailable"
                    checked={form.codAvailable}
                    onChange={handleField}
                  />
                  <label htmlFor="codAvailable" className="form-label" style={{ margin: 0 }}>
                    COD Available
                  </label>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th><th>Title</th><th>Author</th><th>Genre</th>
                <th>Price</th><th>Stock</th><th>Rating</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={8}><div className="skeleton" style={{ height: 20 }} /></td>
                    </tr>
                  ))
                : books.map((b) => (
                    <tr key={b.bookId}>
                      <td className="fw-600">#{b.bookId}</td>
                      <td style={{
                        maxWidth: 180,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {b.title}
                      </td>
                      <td>{b.author}</td>
                      <td><span className="badge badge-gray">{b.genre || '—'}</span></td>
                      <td>₹{b.price?.toFixed(2)}</td>
                      <td>
                        <input
                          type="number"
                          className="stock-input form-control"
                          defaultValue={b.stock}
                          min={0}
                          style={{ width: 70 }}
                          onBlur={(e) => handleStockUpdate(b.bookId, e.target.value)}
                        />
                      </td>
                      <td className="text-amber fw-600">
                        ★ {b.rating?.toFixed(1) ?? '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '.4rem' }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm btn-icon"
                            onClick={() => openEdit(b)}
                            aria-label="Edit book"
                          >
                            <FiEdit2 size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm btn-icon"
                            onClick={() => handleDelete(b.bookId)}
                            aria-label="Delete book"
                            style={{ color: 'var(--danger)' }}
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              {!loading && books.length === 0 && (
                <tr><td colSpan={8} className="empty-row">No books found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
