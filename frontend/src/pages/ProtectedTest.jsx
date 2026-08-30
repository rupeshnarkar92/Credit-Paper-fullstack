import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout } from '../api/auth'
import { decrypt } from '../utils/encryption'

const USE_ENCRYPTION = import.meta.env.VITE_USE_ENCRYPTION === 'true'

export default function ProtectedTest() {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/me`, { credentials: 'include' })
      .then((res) => res.json())
      .then(async (data) => {
        if (USE_ENCRYPTION && data.data) {
          setUser(await decrypt(data.data))
        } else {
          setUser(data)
        }
      })
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  if (!user) return <div className="auth-page"><p>Loading...</p></div>

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Protected Test Page</h1>
        <p className="subtitle">You are logged in</p>
        <div className="user-info">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>Verified:</strong> {user.is_email_verified ? 'Yes' : 'No'}</p>
          <p><strong>Provider:</strong> {user.auth_provider}</p>
        </div>
        <button className="btn btn-primary" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  )
}
