import { useState, useEffect, useCallback } from 'react'
import { apiGet } from '../api/auth'

function timeAgo(dateStr) {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`
  const months = Math.floor(days / 30)
  return `${months} month${months > 1 ? 's' : ''} ago`
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getInitials(email) {
  return email.slice(0, 2).toUpperCase()
}

const avatarColors = ['#14b8a6', '#3b82f6', '#7c3aed', '#f59e0b', '#ef4444', '#06b6d4']
function getAvatarColor(email) {
  let hash = 0
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash)
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

export default function SuperAdminUsers() {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (roleFilter) params.set('role', roleFilter)
      if (statusFilter) params.set('status', statusFilter)
      params.set('page', page)
      params.set('limit', '8')

      const data = await apiGet(`/api/superadmin/users?${params.toString()}`)
      setUsers(data.users || [])
      setTotal(data.total || 0)
      setPages(data.pages || 1)
    } catch {
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [search, roleFilter, statusFilter, page])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    setPage(1)
  }, [search, roleFilter, statusFilter])

  const roleLabel = (role) => {
    if (role === 'admin') return 'Admin'
    if (role === 'checker') return 'Checker'
    if (role === 'maker') return 'Maker'
    return 'User'
  }

  return (
    <div className="sa-content">
      <div className="sa-page-head">
        <div>
          <h1 className="sa-page-title">All Users</h1>
          <p className="sa-page-sub">Super Admin / All Users</p>
        </div>
      </div>

      <div className="sa-card">
        <div className="sa-card-head sa-card-head-toolbar">
          <div className="sa-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            <input
              type="text"
              placeholder="Search users by email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="sa-filters">
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="checker">Checker</option>
              <option value="maker">Maker</option>
              <option value="user">User</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="sa-table-wrap">
          <table className="sa-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Joined On</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>No users found</td></tr>
              ) : users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="sa-who-cell">
                      <div className="sa-avatar" style={{ background: getAvatarColor(u.email) }}>{getInitials(u.email)}</div>
                      <div>
                        <div className="sa-user-nm">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="sa-strong">{roleLabel(u.role)}</td>
                  <td>
                    <span className={`sa-badge ${u.is_active ? 'sa-badge-green' : 'sa-badge-red'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{timeAgo(u.last_login)}</td>
                  <td>{formatDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sa-table-foot">
          <span className="sa-table-note">
            Showing {users.length > 0 ? (page - 1) * 8 + 1 : 0} to {Math.min(page * 8, total)} of {total} users
          </span>
          <div className="sa-pager">
            <button className="sa-pg" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
              let p
              if (pages <= 5) p = i + 1
              else if (page <= 3) p = i + 1
              else if (page >= pages - 2) p = pages - 4 + i
              else p = page - 2 + i
              return (
                <button
                  key={p}
                  className={`sa-pg ${p === page ? 'active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              )
            })}
            {pages > 5 && <span className="sa-pg-gap">...</span>}
            {pages > 5 && (
              <button className={`sa-pg ${pages === page ? 'active' : ''}`} onClick={() => setPage(pages)}>
                {pages}
              </button>
            )}
            <button className="sa-pg" disabled={page >= pages} onClick={() => setPage(page + 1)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
