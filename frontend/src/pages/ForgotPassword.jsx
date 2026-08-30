import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api/auth'

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
})

export default function ForgotPassword() {
  const [serverMessage, setServerMessage] = useState('')
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    setServerError('')
    setServerMessage('')
    setLoading(true)
    try {
      const result = await forgotPassword(data.email)
      setServerMessage(result.message)
    } catch (err) {
      setServerError(err.message)
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
          <h1>Reset your password</h1>
          <p className="subtitle">We will email you a link.</p>

          {serverMessage && <div className="alert alert-success">{serverMessage}</div>}
          {serverError && <div className="alert alert-error">{serverError}</div>}

          {!serverMessage && (
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="you@acmecapital.com.au"
                  {...register('email')}
                />
                {errors.email && <span className="error">{errors.email.message}</span>}
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          )}

          <p className="hint">If an account exists for that address, a link is on its way.</p>
        </div>

        <p className="auth-footer">
          <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
