import { useEffect, useMemo, useState } from 'react'
import {
  Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from 'recharts'
import { bookService, orderService } from '../../services'
import { PageLoader } from '../../components/ui/index.jsx'

const COLORS = ['#0f1f3d', '#e8a020', '#16a34a', '#0284c7', '#dc2626', '#9333ea', '#65a30d', '#ea580c']

export default function AdminAnalytics() {
  const [data, setData]       = useState({ orders: [], books: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([orderService.getAll(), bookService.getAll()])
      .then(([o, b]) => {
        setData({
          orders: o.status === 'fulfilled' ? (o.value.data ?? []) : [],
          books:  b.status === 'fulfilled' ? (b.value.data ?? []) : []
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const { statusData, genreData, revenue, deliveredCount } = useMemo(() => {
    const sCounts = data.orders.reduce((acc, o) => {
      acc[o.orderStatus] = (acc[o.orderStatus] || 0) + 1
      return acc
    }, {})
    const sData = Object.entries(sCounts).map(([name, value]) => ({ name, value }))

    const gCounts = data.books.reduce((acc, b) => {
      if (b.genre) acc[b.genre] = (acc[b.genre] || 0) + 1
      return acc
    }, {})
    const gData = Object.entries(gCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }))

    const rev = data.orders
      .filter((o) => o.orderStatus !== 'CANCELLED')
      .reduce((s, o) => s + (o.amountPaid || 0), 0)

    const deliv = data.orders.filter((o) => o.orderStatus === 'DELIVERED').length

    return { statusData: sData, genreData: gData, revenue: rev, deliveredCount: deliv }
  }, [data])

  if (loading) return <PageLoader />

  return (
    <div className="admin-page page-enter">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Analytics</h2>
      </div>

      <div className="stat-cards">
        {[
          { label: 'Total Revenue',    value: `₹${revenue.toFixed(0)}` },
          { label: 'Total Orders',     value: data.orders.length },
          { label: 'Delivered Orders', value: deliveredCount },
          { label: 'Catalogue Size',   value: data.books.length }
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-val">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="analytics-grid">
        <div className="admin-card">
          <h4 className="admin-card-title">Orders by Status</h4>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(e) => e.name}
                >
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted text-center" style={{ padding: '3rem 0' }}>No data yet</p>
          )}
        </div>

        <div className="admin-card">
          <h4 className="admin-card-title">Books by Genre</h4>
          {genreData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={genreData} margin={{ top: 0, right: 0, bottom: 40, left: 0 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: 'var(--gray-500)' }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: 'var(--gray-500)' }} />
                <Tooltip />
                <Bar dataKey="value" fill="var(--amber)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted text-center" style={{ padding: '3rem 0' }}>No data yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
