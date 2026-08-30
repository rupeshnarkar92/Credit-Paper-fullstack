import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { decrypt } from '../utils/encryption'

const USE_ENCRYPTION = import.meta.env.VITE_USE_ENCRYPTION === 'true'

export default function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/me`, { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error()
        const data = await res.json()
        if (USE_ENCRYPTION && data.data) {
          setUser(await decrypt(data.data))
        } else {
          setUser(data)
        }
      })
      .catch(() => {
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return children
}
