import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('verifying')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setError('No verification token provided.')
      return
    }

    fetch(`/api/auth/verify-email?token=${token}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.detail || 'Verification failed.')
        if (data.email) {
          setStatus('resent')
          setEmail(data.email)
          setMessage(data.message)
        } else {
          setStatus('success')
        }
      })
      .catch((err) => {
        setStatus('error')
        setError(err.message)
      })
  }, [searchParams])

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-logo">
          <div className="auth-logo-icon">C</div>
          <div className="auth-logo-text">Creditpaper</div>
        </div>

        <div className="auth-card" style={{ textAlign: 'center' }}>
          {status === 'verifying' && (
            <>
              <div className="spinner"></div>
              <h1>Verifying email</h1>
              <p className="subtitle">Please wait while we verify your email...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="success-icon">✓</div>
              <h1>Email verified</h1>
              <p className="subtitle">Your email has been verified successfully.</p>
              <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                Sign in
              </Link>
            </>
          )}

          {status === 'resent' && (
            <>
              <div className="success-icon">✓</div>
              <h1>Link expired</h1>
              <p className="subtitle">{message}</p>
              <p className="hint" style={{ marginTop: 0 }}>
                Check your inbox and click the new link to verify your account.
              </p>
              <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none', marginTop: 16 }}>
                Go to sign in
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="error-icon">✕</div>
              <h1>Verification failed</h1>
              <div className="alert alert-error">{error}</div>
              <Link to="/signup" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
