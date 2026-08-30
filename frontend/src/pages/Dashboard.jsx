import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { logout } from '../api/auth'
import '../styles/dashboard.css'

const handleLogout = async () => {
  await logout()
  window.location.href = '/login'
}

const stats = [
  { label: 'Total Users', value: '1,342', change: '+32 this month', icon: '👥', color: '#14b8a6' },
  { label: 'Domains / Customers', value: '128', change: '+18 this month', icon: '🌐', color: '#14b8a6' },
  { label: 'Subscribers', value: '214', change: '+11 this month', icon: '📋', color: '#14b8a6' },
  { label: 'Pending Credit Papers', value: '23', change: '+6 this month', icon: '📄', color: '#14b8a6' },
  { label: 'AI Credits Used', value: '3.42TB', change: '+7% this month', icon: '🤖', color: '#14b8a6' },
  { label: 'System Health', value: 'Healthy', change: 'All systems operational', icon: '💚', color: '#22c55e' },
]

const recentActivity = [
  { icon: '🌐', text: 'New domain registered', detail: 'Acme Capital Partners', time: '2 min ago', color: '#14b8a6' },
  { icon: '✅', text: 'Credit paper approved', detail: 'Harbor HotelProject', time: '8 min ago', color: '#22c55e' },
  { icon: '👤', text: 'User invited', detail: 'jordan@riversidecap.com', time: '15 min ago', color: '#14b8a6' },
  { icon: '📄', text: 'Large document processed', detail: 'Market Study Q1 2025.pdf', time: '28 min ago', color: '#14b8a6' },
  { icon: '❌', text: 'AI generation failed', detail: 'Deal ID: 7842', time: '35 min ago', color: '#ef4444' },
]

const users = [
  { name: 'Jordan Smith', initials: 'JS', role: 'Admin', status: 'Active', lastLogin: '2 min ago' },
  { name: 'Sarah Chen', initials: 'SC', role: 'Checker', status: 'Active', lastLogin: '18 min ago' },
  { name: 'Michael Brown', initials: 'MB', role: 'Maker', status: 'Active', lastLogin: '1 hour ago' },
  { name: 'David Lee', initials: 'DL', role: 'User', status: 'Active', lastLogin: '3 hours ago' },
  { name: 'Emily Watson', initials: 'EW', role: 'Maker', status: 'Inactive', lastLogin: '5 hours ago' },
]

const domains = [
  { domain: 'acmecapital.com', company: 'Acme Capital Partners', users: 38, status: 'Active', created: 'May 12, 2024' },
  { domain: 'riversidecap.com', company: 'Riverside Capital', users: 18, status: 'Active', created: 'Jun 3, 2024' },
  { domain: 'metrofinance.com', company: 'Metro Finance', users: 31, status: 'Active', created: 'Apr 18, 2024' },
  { domain: 'sunrisefunds.com', company: 'Sunrise Funds', users: 14, status: 'Active', created: 'May 2, 2024' },
  { domain: 'peaklending.com', company: 'Peak Lending', users: 22, status: 'Active', created: 'May 28, 2024' },
]

const subscribers = [
  { plan: 'Enterprise', tenants: 38, active: 35, trial: 2, expired: 1, mrr: '$18,950' },
  { plan: 'Professional', tenants: 52, active: 48, trial: 3, expired: 1, mrr: '$7,200' },
  { plan: 'Starter', tenants: 26, active: 20, trial: 4, expired: 2, mrr: '$1,800' },
  { plan: 'Free Trial', tenants: 12, active: 0, trial: 12, expired: 0, mrr: '$0' },
]

const sidebarItems = [
  { section: 'MAIN', items: [{ label: 'Dashboard', icon: '📊', active: true }] },
  { section: 'USER & TENANT', items: [
    { label: 'All Users', icon: '👥' },
    { label: 'Domain / Customers', icon: '🌐' },
    { label: 'Subscribers', icon: '📋' },
  ]},
  { section: 'CREDIT PAPER', items: [
    { label: 'Pending Credit Papers', icon: '📄' },
    { label: 'AI Jobs', icon: '🤖' },
  ]},
  { section: 'SYSTEM', items: [
    { label: 'System Usage', icon: '📈' },
    { label: 'Audit Logs', icon: '📝' },
    { label: 'Settings', icon: '⚙️' },
  ]},
]

export default function Dashboard() {
  const [activeItem, setActiveItem] = useState('Dashboard')

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">C</div>
          <span>CREDITPAPER</span>
        </div>

        <nav className="sidebar-nav">
          {sidebarItems.map((group) => (
            <div key={group.section} className="nav-group">
              <div className="nav-group-title">{group.section}</div>
              {group.items.map((item) => (
                <button
                  key={item.label}
                  className={`nav-item ${activeItem === item.label ? 'active' : ''}`}
                  onClick={() => setActiveItem(item.label)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="dashboard-header">
          <div>
            <div className="breadcrumb">— 01 · DASHBOARD</div>
            <h1 className="welcome-title">Welcome back, Super Admin</h1>
            <p className="welcome-subtitle">Here's what's happening in your system today.</p>
          </div>
          <div className="header-actions">
            <div className="date-picker">
              📅 May 10, 2025 – Jun 8, 2025
            </div>
            <button className="btn-export">⬇ Export Report</button>
            <button className="btn-logout" onClick={handleLogout}>🚪 Logout</button>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="stats-grid">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: stat.color + '20', color: stat.color }}>
                {stat.icon}
              </div>
              <div>
                <div className="stat-label">{stat.label}</div>
                <div className="stat-value" style={{ color: stat.label === 'System Health' ? '#22c55e' : '#1f2937' }}>
                  {stat.value}
                </div>
                <div className="stat-change">↑ {stat.change}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="charts-row">
          {/* Credit Papers Trend */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Credit Papers Trend</h3>
              <div className="chart-legend">
                <span className="legend-item"><span className="legend-dot" style={{background:'#14b8a6'}}></span>Generated</span>
                <span className="legend-item"><span className="legend-dot" style={{background:'#22c55e'}}></span>Approved</span>
                <span className="legend-item"><span className="legend-dot" style={{background:'#f59e0b'}}></span>In Review</span>
                <span className="legend-item"><span className="legend-dot" style={{background:'#3b82f6'}}></span>Issued</span>
              </div>
            </div>
            <div className="chart-placeholder">
              <svg viewBox="0 0 400 150" className="trend-chart">
                <line x1="0" y1="125" x2="400" y2="125" stroke="#e5e7eb" strokeWidth="1"/>
                <line x1="0" y1="100" x2="400" y2="100" stroke="#e5e7eb" strokeWidth="1"/>
                <line x1="0" y1="75" x2="400" y2="75" stroke="#e5e7eb" strokeWidth="1"/>
                <line x1="0" y1="50" x2="400" y2="50" stroke="#e5e7eb" strokeWidth="1"/>
                <line x1="0" y1="25" x2="400" y2="25" stroke="#e5e7eb" strokeWidth="1"/>
                <polyline points="0,100 80,90 160,70 240,55 320,45 400,35" fill="none" stroke="#14b8a6" strokeWidth="2"/>
                <polyline points="0,110 80,105 160,95 240,80 320,70 400,55" fill="none" stroke="#22c55e" strokeWidth="2"/>
                <polyline points="0,115 80,112 160,105 240,95 320,88 400,78" fill="none" stroke="#f59e0b" strokeWidth="2"/>
                <polyline points="0,120 80,118 160,112 240,105 320,98 400,90" fill="none" stroke="#3b82f6" strokeWidth="2"/>
              </svg>
              <div className="chart-labels">
                <span>May 10</span><span>May 17</span><span>May 24</span><span>May 31</span><span>Jun 7</span>
              </div>
            </div>
          </div>

          {/* Credits Usage */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Credits Usage</h3>
            </div>
            <div className="donut-container">
              <div className="donut-chart">
                <div className="donut-center">
                  <div className="donut-value">3.42 TB</div>
                  <div className="donut-label">Total Used</div>
                </div>
              </div>
              <div className="donut-legend">
                <div className="legend-row"><span className="legend-dot" style={{background:'#14b8a6'}}></span>Document Processing<span className="legend-pct">42%</span></div>
                <div className="legend-row"><span className="legend-dot" style={{background:'#22c55e'}}></span>Paper Generation<span className="legend-pct">32%</span></div>
                <div className="legend-row"><span className="legend-dot" style={{background:'#a78bfa'}}></span>AI Analysis<span className="legend-pct">16%</span></div>
                <div className="legend-row"><span className="legend-dot" style={{background:'#9ca3af'}}></span>Other<span className="legend-pct">10%</span></div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Recent Activity</h3>
              <a href="#" className="view-all">View All</a>
            </div>
            <div className="activity-list">
              {recentActivity.map((item, i) => (
                <div key={i} className="activity-item">
                  <div className="activity-icon" style={{ backgroundColor: item.color + '20', color: item.color }}>
                    {item.icon}
                  </div>
                  <div className="activity-content">
                    <div className="activity-text">{item.text}</div>
                    <div className="activity-detail">{item.detail}</div>
                  </div>
                  <div className="activity-time">{item.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tables Row */}
        <div className="tables-row">
          {/* All Users Table */}
          <div className="table-card">
            <div className="table-header">
              <h3>All Users</h3>
              <a href="#" className="view-all">View All</a>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>USER</th>
                  <th>ROLE</th>
                  <th>STATUS</th>
                  <th>LAST LOGIN</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <tr key={i}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar" style={{ background: user.status === 'Inactive' ? '#9ca3af' : '#14b8a6' }}>
                          {user.initials}
                        </div>
                        {user.name}
                      </div>
                    </td>
                    <td>{user.role}</td>
                    <td>
                      <span className={`status-badge ${user.status === 'Active' ? 'active' : 'inactive'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td>{user.lastLogin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="table-footer">Showing 1 to 5 of 1,342</div>
          </div>

          {/* Domains Table */}
          <div className="table-card">
            <div className="table-header">
              <h3>Domain / Customers</h3>
              <a href="#" className="view-all">View All</a>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>DOMAIN</th>
                  <th>COMPANY</th>
                  <th>USERS</th>
                  <th>STATUS</th>
                  <th>CREATED ON</th>
                </tr>
              </thead>
              <tbody>
                {domains.map((d, i) => (
                  <tr key={i}>
                    <td className="domain-link">{d.domain}</td>
                    <td>{d.company}</td>
                    <td>{d.users}</td>
                    <td><span className="status-badge active">{d.status}</span></td>
                    <td>{d.created}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="table-footer">Showing 1 to 5 of 128</div>
          </div>

          {/* Subscribers Table */}
          <div className="table-card">
            <div className="table-header">
              <h3>Subscribers</h3>
              <a href="#" className="view-all">View All</a>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>PLAN</th>
                  <th>TENANTS</th>
                  <th>ACTIVE</th>
                  <th>TRIAL</th>
                  <th>EXPIRED</th>
                  <th>MRR</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((s, i) => (
                  <tr key={i}>
                    <td className="plan-name">{s.plan}</td>
                    <td>{s.tenants}</td>
                    <td className="active-count">{s.active || '-'}</td>
                    <td>{s.trial}</td>
                    <td>{s.expired || '-'}</td>
                    <td className="mrr">{s.mrr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="table-footer">Showing 1 to 4 of 4 plans</div>
          </div>
        </div>
      </main>
    </div>
  )
}
