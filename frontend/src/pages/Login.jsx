import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { login } from '../api/auth'
import PasswordInput from '../components/PasswordInput'

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export default function Login() {
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    setServerError('')
    setLoading(true)
    try {
      await login(data.email, data.password)
      window.location.href = '/dashboard'
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
          <h1>Sign in</h1>
          <p className="subtitle">Welcome back.</p>

          {serverError && <div className="alert alert-error">{serverError}</div>}

          <button
            type="button"
            className="btn btn-outline"
            onClick={() => { window.location.href = '/api/auth/google' }}
          >
            Continue with Google
          </button>

          <div className="divider"><span>or</span></div>

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

            <div className="field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ margin: 0 }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: '12px', color: '#6b7280' }}>Forgot?</Link>
              </div>
              <PasswordInput
                placeholder="••••••••••"
                error={errors.password?.message}
                {...register('password')}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account? <Link to="/signup">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
