import { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { encrypt, decrypt } from '../utils/encryption'

const USE_ENCRYPTION = import.meta.env.VITE_USE_ENCRYPTION === 'true'

export default function CheckEmail() {
  const location = useLocation()
  const email = location.state?.email || 'your email'
  const [countdown, setCountdown] = useState(42)
  const [resending, setResending] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleResend = async () => {
    setResending(true)
    setMessage('')
    try {
      let body
      if (USE_ENCRYPTION) {
        const encrypted = await encrypt({ email })
        body = JSON.stringify({ data: encrypted })
      } else {
        body = JSON.stringify({ email })
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body,
      })
      const data = await res.json()

      let result = data
      if (USE_ENCRYPTION && data.data) {
        result = await decrypt(data.data)
      }

      setMessage(result.message)
      setCountdown(60)
    } catch {
      setMessage('Failed to resend. Try again.')
    } finally {
      setResending(false)
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
          <h1>Confirm your email</h1>
          <p className="subtitle">One step before we begin.</p>

          <div className="info-box">
            <div>
              We sent a link to <b>{email}</b>. Open it to continue.
            </div>
          </div>

          {message && (
            <div className="alert alert-success">{message}</div>
          )}

          <button
            onClick={handleResend}
            disabled={countdown > 0 || resending}
            className="btn btn-outline"
            style={{
              color: countdown > 0 ? '#9ca3af' : '#1a1a1a',
              cursor: countdown > 0 ? 'default' : 'pointer',
            }}
          >
            {resending ? 'Sending...' : <>Resend link <span style={{ marginLeft: 4, color: '#9ca3af' }}>({countdown > 0 ? countdown : '0:00'})</span></>}
          </button>

          <p className="hint">
            Wrong address? <Link to="/signup" style={{ fontWeight: 600, color: '#1a1a1a' }}>Change it</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
