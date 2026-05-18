import { Link } from 'react-router-dom'
import { FiBook, FiGithub, FiTwitter, FiInstagram } from 'react-icons/fi'

const COLUMNS = [
  {
    title: 'Catalog',
    links: [
      ['All Books', '/books'],
      ['Featured', '/books/featured'],
      ['New Arrivals', '/books/new-arrivals'],
      ['Search', '/search']
    ]
  },
  {
    title: 'Account',
    links: [
      ['Profile', '/profile'],
      ['My Orders', '/orders'],
      ['Wallet', '/wallet'],
      ['Wishlist', '/wishlist']
    ]
  }
]

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">
              <FiBook color="var(--amber)" size={20} />
              <span>BookNest</span>
            </div>
            <p className="footer-tagline">
              Your curated bookstore for discovering, purchasing and reviewing the books that matter to you.
            </p>
            <div className="footer-socials">
              {[FiGithub, FiTwitter, FiInstagram].map((Icon, i) => (
                <a key={i} href="#" aria-label="Social link"><Icon size={18} /></a>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h6 className="footer-col-title">{col.title}</h6>
              <div className="footer-col-links">
                {col.links.map(([label, to]) => (
                  <Link key={label} to={to}>{label}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} BookNest Platform. All rights reserved.</span>
          <span>Built with ♥ by Hariom</span>
        </div>
      </div>

      <style>{`
        .site-footer {
          background: var(--navy);
          color: rgba(255, 255, 255, 0.7);
          padding: 3rem 0 1.5rem;
          margin-top: auto;
        }
        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 2rem;
          margin-bottom: 2rem;
        }
        .footer-brand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          font-family: var(--font-display);
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--white);
        }
        .footer-tagline { font-size: 0.875rem; line-height: 1.7; max-width: 280px; }
        .footer-socials { display: flex; gap: 0.75rem; margin-top: 1rem; }
        .footer-socials a {
          color: rgba(255, 255, 255, 0.5);
          transition: var(--transition);
        }
        .footer-socials a:hover { color: var(--amber); }
        .footer-col-title {
          color: var(--white);
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 0.875rem;
          margin-bottom: 0.75rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .footer-col-links { display: flex; flex-direction: column; gap: 0.4rem; }
        .footer-col-links a {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.6);
          transition: var(--transition);
        }
        .footer-col-links a:hover { color: var(--amber); }
        .footer-bottom {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 1.25rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
          font-size: 0.8rem;
        }
        @media (max-width: 768px) {
          .footer-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 480px) {
          .footer-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </footer>
  )
}
