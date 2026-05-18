import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container" style={{
      minHeight: '70vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: 480 }}>
        <img 
          src="https://cdn-icons-png.flaticon.com/512/2702/2702172.png" 
          alt="Book Icon" 
          style={{ width: 120, marginBottom: '1.5rem' }} 
        />
        <div style={{
          fontSize: '6rem',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          color: 'var(--amber)',
          lineHeight: 1
        }}>
          404
        </div>
        <h2 style={{ marginTop: '1rem', marginBottom: '0.75rem' }}>Page not found</h2>
        <p className="text-muted" style={{ marginBottom: '2rem' }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="btn btn-primary">Go Home</Link>
          <Link to="/books" className="btn btn-outline">Browse Books</Link>
        </div>
      </div>
    </div>
  )
}
