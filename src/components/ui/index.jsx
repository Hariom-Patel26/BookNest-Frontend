import { FiStar } from 'react-icons/fi'

// ─── Loader ──────────────────────────────────────────────────────────────────
export function Loader({ size = 40, color = 'var(--amber)' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
      <div
        role="status" aria-label="Loading"
        style={{
          width: size, height: size,
          border: '3px solid var(--gray-100)',
          borderTopColor: color,
          borderRadius: '50%',
          animation: 'bn-spin .7s linear infinite'
        }}
      />
      <style>{`@keyframes bn-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ─── Full-page loader ────────────────────────────────────────────────────────
export function PageLoader() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader size={48} />
    </div>
  )
}

// ─── Skeleton card (book grid placeholder) ───────────────────────────────────
export function SkeletonCard() {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="skeleton" style={{ aspectRatio: '3/4', width: '100%' }} />
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
        <div className="skeleton" style={{ height: 12, width: '40%' }} />
        <div className="skeleton" style={{ height: 16, width: '90%' }} />
        <div className="skeleton" style={{ height: 14, width: '60%' }} />
        <div className="skeleton" style={{ height: 14, width: '70%', marginTop: '.5rem' }} />
      </div>
    </div>
  )
}

// ─── Star rating ────────────────────────────────────────────────────────────
export function StarRating({ rating = 0, max = 5, size = 16, interactive = false, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {Array.from({ length: max }, (_, i) => i + 1).map((s) => (
        <FiStar
          key={s}
          size={size}
          fill={s <= Math.round(rating) ? 'var(--amber)' : 'none'}
          color={s <= Math.round(rating) ? 'var(--amber)' : 'var(--gray-300)'}
          style={{ cursor: interactive ? 'pointer' : 'default' }}
          onClick={() => interactive && onChange && onChange(s)}
        />
      ))}
    </div>
  )
}

// ─── Empty state ────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title, description, action, gridSpan = false }) {
  return (
    <div className="empty-state" style={gridSpan ? { gridColumn: '1/-1' } : undefined}>
      <div className="empty-state-icon">{icon}</div>
      {title && <h4>{title}</h4>}
      {description && <p className="text-muted">{description}</p>}
      {action}
    </div>
  )
}
