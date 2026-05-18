# BookNest — React Frontend

Modern React (Vite) frontend for the BookNest e-commerce platform. Talks to the
Spring Boot microservices through the API gateway at `http://localhost:8080`.

## Quick start

```bash
npm install
npm run dev      # dev server on http://localhost:3000 (proxies /api -> :8080)
npm run build    # production build → dist/
npm run preview  # preview the production build
```

## Project structure

```
src/
├── components/         # Reusable UI
│   ├── ui/             # Loader, SkeletonCard, StarRating, EmptyState
│   ├── BookCard.jsx
│   ├── ErrorBoundary.jsx
│   ├── Footer.jsx
│   ├── Navbar.jsx
│   └── ProtectedRoute.jsx   # ProtectedRoute + AdminRoute
├── context/            # Global state (Context API)
│   ├── AuthContext.jsx
│   └── CartContext.jsx
├── services/           # All HTTP calls (was: api/)
│   ├── apiClient.js    # Axios instance, JWT injection, 401 handler
│   ├── authService.js
│   ├── bookService.js
│   ├── cartService.js
│   ├── orderService.js
│   ├── walletService.js
│   ├── reviewService.js
│   ├── notificationService.js
│   ├── wishlistService.js
│   ├── paymentService.js  # Razorpay create + verify
│   └── index.js        # Barrel
├── pages/
│   ├── admin/          # Admin-only pages
│   ├── Auth.jsx        # Login + Register (no role selector)
│   ├── Books.jsx       # Catalog + Detail + Search
│   ├── Cart.jsx
│   ├── Checkout.jsx    # COD / Wallet / Razorpay
│   ├── Home.jsx
│   ├── NotFound.jsx
│   ├── Notifications.jsx
│   ├── Orders.jsx
│   ├── Profile.jsx
│   ├── Wallet.jsx
│   └── Wishlist.jsx
├── styles/global.css
├── App.jsx
└── main.jsx
```

## Key changes from the original

### 🔒 Security & access control

- **No role selector in signup/login.** New users are always created as
  `CUSTOMER`. The frontend strips any `role` field client-side before
  sending — defense-in-depth on top of the backend default.
- **Role escalation** lives only in `Admin → Users` and is restricted to
  existing admins. Admins can promote/demote, but cannot change their own role.
- **Route guards.** `<ProtectedRoute>` for any logged-in route,
  `<AdminRoute>` for admin pages. Both preserve the attempted URL for
  post-login redirect.
- **Role-based redirect after login.** Admins land on `/admin`,
  customers on the page they tried to visit (or `/`).
- **JWT.** Stored in `localStorage`, attached automatically by the axios
  interceptor. A 401 response on a non-auth request clears storage and
  redirects to `/login` (login attempts themselves are NOT redirected so
  the form can show its own error).

### 💳 Razorpay integration

The new `Checkout` page supports three payment modes:

| Mode      | Flow                                                                |
|-----------|---------------------------------------------------------------------|
| COD       | `POST /orders/place`                                                |
| Wallet    | Order placed first → wallet debited with the real `orderId`         |
| Razorpay  | Lazy-load checkout JS → create order → user pays → server verifies  |

The Razorpay flow uses the new backend endpoints we added in `order-service`:

```
POST /api/v1/orders/payment/create-razorpay-order
POST /api/v1/orders/payment/verify
```

The checkout script (`https://checkout.razorpay.com/v1/checkout.js`) is loaded
lazily on first use — no payload tax for users who never pay online.

### 🪙 Wallet bug fix

Original code: `walletApi.payMoney()` ran **before** the order was created. If
the order POST failed, money was gone with no order to show for it.

Fixed flow in `Checkout.placeWalletOrder`:

1. `orderService.placeOnline(payload)` — creates the order, gets the real `orderId`.
2. `walletService.payMoney(walletId, { amount, orderId, remarks })` — debits with
   the correct order reference.
3. If the wallet step fails after the order is created, surface a clear
   "contact support" message rather than guessing about state we don't fully
   control (the order is the source of truth).

### 🔍 Elasticsearch search

The Search page (`pages/Books.jsx → Search`) re-runs whenever the URL search
params change (the original had `[]` deps and went stale on URL changes). It
also falls back to the MySQL keyword endpoint if Elasticsearch is down, so the
page never shows zero results purely because ES is restarting.

The navbar autocomplete uses `bookService.autocomplete()` with a 220 ms debounce.

### 🗂️ Admin "Add Book" modal scroll bug — FIXED

In the original `Admin.css`:
```css
.modal-overlay { display: flex; align-items: center; }
.modal-card    { max-height: 90vh; overflow-y: auto; }
```
On a viewport shorter than ~750px, the centered card was clipped from both
ends and the inner scroll couldn't recover what was clipped above the fold.

Fixed in this version:
```css
.modal-overlay {
  align-items: flex-start;          /* was center */
  overflow-y: auto;                 /* the OVERLAY scrolls */
  padding: 2rem 1rem;
}
.modal-card {
  margin: auto 0;                   /* center when content is short */
  /* no max-height — let the overlay scroll */
}
```
Plus the modal header is `position: sticky` so the title and close button stay
reachable while scrolling, and `document.body.style.overflow = 'hidden'` while
open so two scrollbars don't compete.

### 🎨 UI/UX

- **Inter** as the primary UI font (was DM Sans). Playfair Display retained
  only for headings and the brand wordmark — gives the editorial bookstore
  feel without inconsistency.
- **Top-level ErrorBoundary** so a single render error doesn't blank the app.
- **Proper 404 page** at `/404` (was a silent redirect to `/`).
- **Consistent loading states** via `<PageLoader>` and `<SkeletonCard>`.
- **Mobile drawer** locks the body scroll while open.
- All forms have proper `autocomplete` attributes and `aria-label`s.

## Backend prerequisites

Mostly compatible with the existing API. Two notes:

1. **Admin role-update endpoint.** The Admin → Users page calls
   ```
   PUT /api/v1/auth/users/:userId/role
   body: { "role": "ADMIN" | "CUSTOMER" }
   ```
   Make sure your `auth-service` exposes this and that it's gated to admins
   (e.g., a `@PreAuthorize("hasRole('ADMIN')")` on the controller method, plus
   the gateway's existing JWT filter).

2. **Razorpay endpoints.** These are the ones we added in the order-service
   refactor:
   ```
   POST /api/v1/orders/payment/create-razorpay-order
   POST /api/v1/orders/payment/verify
   ```
   No env vars needed on the frontend — the public Razorpay key is returned
   inside the create-order response (`keyId`).

## Environment

The Vite dev server proxies `/api/*` → `http://localhost:8080`. Change the
target in `vite.config.js` if your gateway runs elsewhere.

For production, the `dist/` folder is fully static — drop it behind any HTTP
server (nginx, S3+CloudFront, Vercel, Netlify) and configure a fallback to
`index.html` for client-side routing.
