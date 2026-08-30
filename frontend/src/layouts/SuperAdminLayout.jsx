import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { apiGet } from '../api/auth'

const navSections = [
  {
    items: [
      { to: '/superadmin/dashboard', label: 'Dashboard', icon: 'grid' },
    ],
  },
  {
    label: 'USER & TENANT',
    items: [
      { to: '/superadmin/users', label: 'All Users', icon: 'users' },
      { label: 'Domain / Customers', icon: 'globe', disabled: true },
      { label: 'Subscribers', icon: 'layers', disabled: true },
    ],
  },
  {
    label: 'CREDIT PAPER',
    items: [
      { label: 'Pending Credit Papers', icon: 'file', disabled: true },
      { label: 'AI Jobs', icon: 'cpu', disabled: true },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { label: 'System Usage', icon: 'activity', disabled: true },
      { label: 'Audit Logs', icon: 'clipboard', disabled: true },
      { label: 'Settings', icon: 'cog', disabled: true },
    ],
  },
  {
    label: 'SWITCH TO',
    items: [
      { label: 'Main App', icon: 'grid', disabled: true },
      { label: 'Tenant Admin', icon: 'users', disabled: true },
    ],
  },
]

const icons = {
  grid: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  users: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  globe: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18"/></svg>,
  layers: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>,
  file: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/></svg>,
  cpu: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/></svg>,
  activity: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  clipboard: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h4"/></svg>,
  cog: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>,
}

const logoutIcon = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>

export default function SuperAdminLayout() {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    apiGet('/api/superadmin/me')
      .then((data) => {
        const u = data.user || data
        if (!u.is_super_admin) {
          navigate('/superadmin/login')
          return
        }
        setUser(u)
      })
      .catch(() => navigate('/superadmin/login'))
  }, [navigate])

  const handleLogout = async () => {
    await fetch(`${import.meta.env.VITE_API_URL}/api/superadmin/logout`, {
      method: 'POST',
      credentials: 'include',
    })
    navigate('/superadmin/login')
  }

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'SA'

  return (
    <div className="sa-layout">
      <aside className="sa-sidebar">
        <div className="sa-brand">
          <div className="sa-brand-mark">C</div>
          <div className="sa-brand-name">CREDITPAPER</div>
        </div>

        <nav className="sa-nav">
          {navSections.map((section, si) => (
            <div key={si} className="sa-nav-group">
              {section.label && <div className="sa-nav-label">{section.label}</div>}
              {section.items.map((item) => (
                item.disabled ? (
                  <span key={item.label} className="sa-nav-item sa-nav-disabled">
                    <span className="sa-nav-icon">{icons[item.icon]}</span>
                    {item.label}
                  </span>
                ) : (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `sa-nav-item ${isActive ? 'active' : ''}`}
                  >
                    <span className="sa-nav-icon">{icons[item.icon]}</span>
                    {item.label}
                  </NavLink>
                )
              ))}
            </div>
          ))}
        </nav>

        <div className="sa-sidebar-footer">
          <div className="sa-user-avatar">{initials}</div>
          <div className="sa-user-info">
            <div className="sa-user-name">Super Admin</div>
            <div className="sa-user-email">{user?.email || ''}</div>
          </div>
        </div>

        <div style={{ padding: '0 16px 12px' }}>
          <a className="sa-nav-item sa-logout-item" onClick={() => {
            if (window.confirm('Are you sure you want to logout?')) {
              handleLogout()
            }
          }}>
            <span className="sa-nav-icon">{logoutIcon}</span>
            Logout
          </a>
        </div>
      </aside>

      <main className="sa-main">
        <Outlet />
      </main>
    </div>
  )
}
