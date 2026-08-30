import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { register as registerUser } from '../api/auth'
import PasswordInput from '../components/PasswordInput'

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/\d/, 'Must contain a digit'),
})

export default function Signup() {
  const navigate = useNavigate()
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
      await registerUser(data.email, data.password)
      navigate('/check-email', { state: { email: data.email } })
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
          <h1>Create an account</h1>
          <p className="subtitle">Two fields. Your firm is identified by your email domain.</p>

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
              <label>Work email</label>
              <input
                type="email"
                placeholder="you@acmecapital.com.au"
                {...register('email')}
              />
              {errors.email && <span className="error">{errors.email.message}</span>}
            </div>

            <PasswordInput
              label="Password"
              placeholder="••••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
