import api from './apiClient'

const bookService = {
  // ─── Public reads ─────────────────────────────────────
  getAll:           () => api.get('/books'),
  getById:          (id) => api.get(`/books/${id}`),
  getFeatured:      () => api.get('/books/featured'),
  getNewArrivals:   () => api.get('/books/new-arrivals'),
  getTopRated:      () => api.get('/books/top-rated'),
  getByGenre:       (genre) => api.get(`/books/genre/${encodeURIComponent(genre)}`),
  getByAuthor:      (author) => api.get(`/books/author/${encodeURIComponent(author)}`),
  getByPriceRange:  (min, max) => api.get('/books/price-range', { params: { min, max } }),

  // ─── Search (Elasticsearch) ───────────────────────────
  search:           (keyword) => api.get('/books/es/search', { params: { keyword } }),
  advancedSearch:   (params) => api.get('/books/es/search/advanced', { params }),
  autocomplete:     (prefix) => api.get('/books/es/autocomplete', { params: { prefix } }),
  getSimilar:       (id) => api.get(`/books/es/similar/${id}`),

  // ─── Search (MySQL fallback — works even if ES is down) ─
  searchFallback:   (keyword) => api.get('/books/search', { params: { keyword } }),

  // ─── Admin writes ─────────────────────────────────────
  addBook:          (data) => api.post('/books', data),
  updateBook:       (id, data) => api.put(`/books/${id}`, data),
  deleteBook:       (id) => api.delete(`/books/${id}`),
  updateStock:      (id, stock) => api.put(`/books/${id}/stock`, { stock }),
  reindex:          () => api.post('/books/es/reindex')
}

export default bookService
