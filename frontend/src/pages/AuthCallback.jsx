import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/me`, { credentials: 'include' })
      .then(async (res) => {
        if (res.ok) {
          navigate('/dashboard')
        } else {
          navigate('/login')
        }
      })
      .catch(() => navigate('/login'))
  }, [navigate])

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="spinner"></div>
        <h1>Signing in...</h1>
        <p className="subtitle">Please wait while we complete your sign in.</p>
      </div>
    </div>
  )
}
