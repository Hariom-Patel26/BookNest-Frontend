import { Component } from 'react'

/**
 * Top-level error boundary so a single render error doesn't blank the entire app.
 * Falls back to a friendly card with a "reload" button.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info)
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div className="card" style={{
          padding: '2.5rem',
          maxWidth: 480,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😵</div>
          <h3 style={{ marginBottom: '.5rem' }}>Something went wrong</h3>
          <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button className="btn btn-primary" onClick={this.handleReload}>
            Reload Page
          </button>
        </div>
      </div>
    )
  }
}
