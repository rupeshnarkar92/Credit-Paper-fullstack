import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSearchParams, Link } from 'react-router-dom'
import { resetPassword } from '../api/auth'
import PasswordInput from '../components/PasswordInput'

const schema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/\d/, 'Must contain a digit'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [serverMessage, setServerMessage] = useState('')
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) })

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-logo">
            <div className="auth-logo-icon">C</div>
            <div className="auth-logo-text">Creditpaper</div>
          </div>
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <div className="error-icon">✕</div>
            <h1>No reset token</h1>
            <p className="subtitle">Please request a new password reset link.</p>
            <Link to="/forgot-password" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              Request new link
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const onSubmit = async (data) => {
    setServerError('')
    setServerMessage('')
    setLoading(true)
    try {
      const result = await resetPassword(token, data.password)
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

        <div className="auth-card" style={serverMessage ? { textAlign: 'center' } : {}}>
          {serverMessage ? (
            <>
              <div className="success-icon">✓</div>
              <div className="alert alert-success">{serverMessage}</div>
              <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                Sign in
              </Link>
            </>
          ) : (
            <>
              <h1>Choose a new password</h1>
              <p className="subtitle">This link can be used once.</p>

              {serverError && <div className="alert alert-error">{serverError}</div>}

              <form onSubmit={handleSubmit(onSubmit)}>
                <PasswordInput
                  label="New password"
                  placeholder="••••••••••"
                  error={errors.password?.message}
                  {...register('password')}
                />

                <PasswordInput
                  label="Confirm"
                  placeholder="••••••••••"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />

                <div className="info-box">
                  Signing in again will be required on your other devices.
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Updating...' : 'Update password'}
                </button>
              </form>
            </>
          )}
        </div>

        {!serverMessage && (
          <p className="auth-footer">
            <Link to="/login">Back to sign in</Link>
          </p>
        )}
      </div>
    </div>
  )
}
