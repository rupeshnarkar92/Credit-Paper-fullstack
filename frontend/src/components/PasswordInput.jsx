import { useState, forwardRef } from 'react'

const PasswordInput = forwardRef(function PasswordInput({ label, error, ...props }, ref) {
  const [show, setShow] = useState(false)

  return (
    <div className="form-group">
      {label && <label>{label}</label>}
      <div className="password-wrapper">
        <input
          type={show ? 'text' : 'password'}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          className="toggle-password"
          onClick={() => setShow(!show)}
          tabIndex={-1}
        >
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
      {error && <span className="error">{error}</span>}
    </div>
  )
})

export default PasswordInput
