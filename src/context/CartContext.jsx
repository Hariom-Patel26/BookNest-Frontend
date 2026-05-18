import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { cartService, getErrorMessage } from '../services'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { user, isLoggedIn } = useAuth()
  const [cart, setCart]                 = useState(null)
  const [cartLoading, setCartLoading]   = useState(false)
  const [error, setError]               = useState(null)

  const fetchCart = useCallback(async () => {
    if (!isLoggedIn || !user?.userId) {
      setCart(null)
      return
    }
    setCartLoading(true)
    setError(null)
    try {
      const res = await cartService.getCart(user.userId)
      setCart(res.data)
    } catch (err) {
      // 404 just means the cart hasn't been created yet — not an error per se.
      if (err.response?.status !== 404) {
        setError(getErrorMessage(err, 'Could not load cart'))
      }
      setCart(null)
    } finally {
      setCartLoading(false)
    }
  }, [isLoggedIn, user?.userId])

  useEffect(() => { fetchCart() }, [fetchCart])

  // ─── Mutations (each refetches for a single source of truth) ────────────
  const addToCart = useCallback(async (book, quantity = 1) => {
    if (!user) throw new Error('Login required')
    await cartService.addItem(user.userId, {
      bookId:    book.bookId ?? book.id,
      bookTitle: book.title,
      price:     book.price,
      quantity
    })
    await fetchCart()
  }, [user, fetchCart])

  const removeFromCart = useCallback(async (itemId) => {
    if (!user) return
    await cartService.removeItem(user.userId, itemId)
    await fetchCart()
  }, [user, fetchCart])

  const updateQuantity = useCallback(async (itemId, quantity) => {
    if (!user || quantity < 1) return
    await cartService.updateQuantity(user.userId, itemId, quantity)
    await fetchCart()
  }, [user, fetchCart])

  const clearCart = useCallback(async () => {
    if (!user) return
    try {
      await cartService.clearCart(user.userId)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to clear cart'))
    } finally {
      await fetchCart()
    }
  }, [user, fetchCart])

  const value = useMemo(() => {
    const items     = cart?.items ?? []
    const itemCount = items.length
    const totalQty  = items.reduce((s, i) => s + (i.quantity ?? 0), 0)
    const total     = cart?.totalPrice ?? items.reduce((s, i) => s + (i.price ?? 0) * (i.quantity ?? 0), 0)
    return {
      cart, cartLoading, error,
      items, itemCount, totalQty, total,
      fetchCart, addToCart, removeFromCart, updateQuantity, clearCart
    }
  }, [cart, cartLoading, error, fetchCart, addToCart, removeFromCart, updateQuantity, clearCart])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}
