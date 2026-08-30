import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiPost } from '../api/auth'
import PasswordInput from '../components/PasswordInput'

export default function SuperAdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await apiPost('/api/superadmin/login', { email, password })
      const user = data.user || data
      if (user.is_super_admin) {
        navigate('/superadmin/dashboard')
      } else {
        setError('Access denied. Super admin privileges required.')
      }
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-logo">
          <div className="auth-logo-icon">C</div>
          <div className="auth-logo-text">Creditpaper</div>
        </div>

        <div className="auth-card">
          <h1>Super Admin</h1>
          <p className="subtitle">Sign in to the admin panel</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                placeholder="superadmin@creditpaper.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <PasswordInput
              label="Password"
              placeholder="••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
