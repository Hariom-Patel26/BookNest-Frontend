import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'

import ErrorBoundary from './components/ErrorBoundary'
import Footer from './components/Footer'
import Navbar from './components/Navbar'
import ScrollToTop from './components/ScrollToTop'
import Banner from './components/Banner'
import { AdminRoute, ProtectedRoute } from './components/ProtectedRoute'

// Public / shared pages
import Home from './pages/Home'
import { Login, Register } from './pages/Auth'
import OAuth2Callback from './pages/OAuth2Callback'
import { BookCatalog, BookDetail, Search } from './pages/Books'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import NotFound from './pages/NotFound'

// Account pages
import Profile       from './pages/Profile'
import Orders        from './pages/Orders'
import Wallet        from './pages/Wallet'
import Wishlist      from './pages/Wishlist'
import Notifications from './pages/Notifications'

// Admin pages
import AdminLayout    from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminBooks     from './pages/admin/AdminBooks'
import AdminOrders    from './pages/admin/AdminOrders'
import AdminUsers     from './pages/admin/AdminUsers'
import AdminReviews   from './pages/admin/AdminReviews'
import AdminAnalytics from './pages/admin/AdminAnalytics'

/** Standard layout used for all customer-facing pages. */
function MainLayout({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Banner />
      <Navbar />
      <div style={{ flex: 1 }}>{children}</div>
      <Footer />
    </div>
  )
}

const TOAST_OPTIONS = {
  style: {
    fontFamily:   'var(--font-body)',
    fontSize:     '.875rem',
    borderRadius: '10px',
    boxShadow:    'var(--shadow-md)',
    maxWidth:     '380px'
  },
  success: { iconTheme: { primary: 'var(--success)', secondary: '#fff' } },
  error:   { iconTheme: { primary: 'var(--danger)',  secondary: '#fff' } }
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <CartProvider>
            <Toaster position="top-right" toastOptions={TOAST_OPTIONS} />

            <Routes>
              {/* ─── Admin (own layout, AdminRoute gated) ─── */}
              <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route index            element={<AdminDashboard />} />
                <Route path="books"     element={<AdminBooks />} />
                <Route path="orders"    element={<AdminOrders />} />
                <Route path="users"     element={<AdminUsers />} />
                <Route path="reviews"   element={<AdminReviews />} />
                <Route path="analytics" element={<AdminAnalytics />} />
              </Route>

              {/* ─── Auth pages (no layout) ─── */}
              <Route path="/login"            element={<Login />} />
              <Route path="/register"         element={<Register />} />
              <Route path="/oauth2/callback"  element={<OAuth2Callback />} />

              {/* ─── Public main-layout pages ─── */}
              <Route path="/"                   element={<MainLayout><Home /></MainLayout>} />
              <Route path="/books"              element={<MainLayout><BookCatalog /></MainLayout>} />
              <Route path="/books/featured"     element={<MainLayout><BookCatalog type="featured" /></MainLayout>} />
              <Route path="/books/new-arrivals" element={<MainLayout><BookCatalog type="new-arrivals" /></MainLayout>} />
              <Route path="/books/genre/:genre" element={<MainLayout><BookCatalog /></MainLayout>} />
              <Route path="/books/:id"          element={<MainLayout><BookDetail /></MainLayout>} />
              <Route path="/search"             element={<MainLayout><Search /></MainLayout>} />
              <Route path="/cart"               element={<MainLayout><Cart /></MainLayout>} />

              {/* ─── Authenticated routes ─── */}
              <Route path="/checkout"      element={<MainLayout><ProtectedRoute><Checkout /></ProtectedRoute></MainLayout>} />
              <Route path="/profile"       element={<MainLayout><ProtectedRoute><Profile /></ProtectedRoute></MainLayout>} />
              <Route path="/orders"        element={<MainLayout><ProtectedRoute><Orders /></ProtectedRoute></MainLayout>} />
              <Route path="/wallet"        element={<MainLayout><ProtectedRoute><Wallet /></ProtectedRoute></MainLayout>} />
              <Route path="/wishlist"      element={<MainLayout><ProtectedRoute><Wishlist /></ProtectedRoute></MainLayout>} />
              <Route path="/notifications" element={<MainLayout><ProtectedRoute><Notifications /></ProtectedRoute></MainLayout>} />

              {/* ─── 404 ─── */}
              <Route path="/404" element={<MainLayout><NotFound /></MainLayout>} />
              <Route path="*"    element={<Navigate to="/404" replace />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
