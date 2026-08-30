# CreditPaper — Authentication System Project Plan

## What We're Building

A complete authentication system with: Signup, Email Verification, Sign In, Google SSO, Forgot/Reset Password, JWT auth, Protected Routes, and Logout.

**Do NOT implement yet:** Application Shell, Sidebar, Header, Dashboard, Customer CRUD, Deals, Documents, Facts, AI generation, Settings, Billing — these belong to later milestones.

---

## Tech Stack

### Frontend

- React
- Vite
- React Router
- React Hook Form
- Zod
- JavaScript
- CSS

### Backend

- Python
- FastAPI
- SQLAlchemy
- Pydantic
- Alembic
- JWT authentication
- Argon2id password hashing

### Database

- PostgreSQL

---

## Product Authentication Flow

```
Signup
  ↓
Email verification
  ↓
Sign in

OR

Google SSO
  ↓
Authenticated

Forgot password
  ↓
Password reset
  ↓
Sign in

After successful authentication:

  ↓
JWT/session
  ↓
Protected route

Logout:

  ↓
Authentication removed
  ↓
Login page
```

---

## Project Structure (Target)

```
CreditPaper/
├── frontend/                          # React + Vite
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── .env
│   ├── .env.example
│   └── src/
│       ├── main.jsx                   # Entry point
│       ├── App.jsx                    # Router setup
│       ├── index.css                  # Global styles
│       ├── api/
│       │   └── auth.js                # API client for auth
│       ├── components/
│       │   ├── ProtectedRoute.jsx      # Auth guard
│       │   └── PasswordInput.jsx       # Reusable password field
│       ├── hooks/
│       │   └── useAuth.js             # Auth state hook
│       ├── pages/
│       │   ├── Signup.jsx
│       │   ├── Login.jsx
│       │   ├── VerifyEmail.jsx
│       │   ├── ForgotPassword.jsx
│       │   ├── ResetPassword.jsx
│       │   └── ProtectedTest.jsx
│       └── context/
│           └── AuthContext.jsx         # Auth state provider
│
├── backend/                           # Python FastAPI
│   ├── requirements.txt
│   ├── .env
│   ├── .env.example
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/                  # Migration files
│   └── app/
│       ├── __init__.py
│       ├── main.py                    # FastAPI app
│       ├── config.py                  # Settings/env
│       ├── database.py                # SQLAlchemy engine
│       ├── dependencies.py            # get_current_user, etc.
│       ├── models/
│       │   ├── __init__.py
│       │   └── user.py                # User model
│       ├── schemas/
│       │   ├── __init__.py
│       │   └── auth.py                # Pydantic schemas
│       ├── security/
│       │   ├── __init__.py
│       │   ├── password.py            # Argon2id hashing
│       │   ├── jwt.py                 # JWT create/verify
│       │   └── tokens.py              # Verification/reset tokens
│       ├── routers/
│       │   ├── __init__.py
│       │   └── auth.py                # /api/auth/* routes
│       └── services/
│           ├── __init__.py
│           ├── email.py               # Email sending
│           └── google.py              # Google OAuth
│
├── docker-compose.yml                 # PostgreSQL
└── .gitignore
```

---

## Implementation Phases & Steps

### Phase 1 — Foundation (STEP 1-3)

| Step | What | Why |
|------|------|-----|
| 1 | Project scaffolding, dependencies, env config | Everything needs a base to run on |
| 2 | User SQLAlchemy model | Core data structure for authentication |
| 3 | Alembic migration | Apply model to PostgreSQL safely |

### Phase 2 — Signup (STEP 4-6)

| Step | What | Why |
|------|------|-----|
| 4 | Pydantic schemas (request/response) | Input validation & type safety |
| 5 | Signup backend API + password hashing + email verification token | Create user account securely |
| 6 | Signup React page | User-facing registration form |

### Phase 3 — Email Verification (STEP 7-10)

| Step | What | Why |
|------|------|-----|
| 7 | Verification token system (generate, validate, expire) | Secure email verification flow |
| 8 | Verification email sending | Deliver verification link |
| 9 | Verify email API endpoint | Process verification token |
| 10 | Email verification React page | User-facing verification UI |

### Phase 4 — Sign In (STEP 11-13)

| Step | What | Why |
|------|------|-----|
| 11 | Login backend API + JWT generation | Authenticate users and issue tokens |
| 12 | Login React page | User-facing sign-in form |
| 13 | JWT validation & auth dependency | Reusable auth middleware |

### Phase 5 — Protected Routes (STEP 14-15)

| Step | What | Why |
|------|------|-----|
| 14 | Protected backend endpoint | Verify backend auth works |
| 15 | Protected React route component | Verify frontend auth guard works |

### Phase 6 — Google SSO (STEP 16-17)

| Step | What | Why |
|------|------|-----|
| 16 | Google OAuth backend | Server-side OAuth flow |
| 17 | Google SSO frontend button + callback | User-facing Google login |

### Phase 7 — Forgot/Reset Password (STEP 18-21)

| Step | What | Why |
|------|------|-----|
| 18 | Forgot password backend (token + email) | Initiate password reset |
| 19 | Forgot password React page | User-facing request form |
| 20 | Reset password backend (validate + update) | Complete password reset |
| 21 | Reset password React page | User-facing new password form |

### Phase 8 — Logout & Final (STEP 22-24)

| Step | What | Why |
|------|------|-----|
| 22 | Logout (clear tokens, optional revocation) | End user session |
| 23 | Complete auth testing | Verify all flows work |
| 24 | Security hardening (CORS, rate limits, HTTPS) | Production readiness |

---

## Tech Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Password hashing | Argon2id (via `argon2-cffi`) | Modern, memory-hard, OWASP recommended |
| JWT library | `python-jose[cryptography]` | Standard, supports RS256/HS256 |
| Email verification | One-time token (random, expiry) | Simple, secure, stateless |
| Password reset | Same token system | Consistent approach |
| Google OAuth | `authlib` | Full OAuth 2.0 support, well maintained |
| Rate limiting | `slowapi` | Easy FastAPI integration |
| CORS | FastAPI built-in middleware | Simple configuration |

---

## Environment Variables

### Backend `.env`

```
DATABASE_URL=postgresql://user:pass@localhost:5432/creditpaper
JWT_SECRET_KEY=<random-64-chars>
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<email>
SMTP_PASSWORD=<app-password>
EMAIL_FROM=noreply@creditpaper.com
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

### Frontend `.env`

```
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=<google-client-id>
```

---

## Authentication Feature Requirements

1. **Signup** — email + password, optional Google SSO button. No firm name, role, or phone during basic signup.
2. **Email Verification** — cryptographically secure token, expires, one-time use, handles valid/invalid/expired/already-used.
3. **Sign In** — email + password + Google SSO. Backend returns all success/error responses (no hardcoding in React).
4. **Google SSO** — client ID, client secret, redirect URI, OAuth state, callback, identity validation, new/existing user, account linking. Backend validates OAuth identity.
5. **Forgot Password** — generic response for both existing and non-existing emails (no account enumeration).
6. **Reset Password** — validate token, check expiration, check one-time use, hash new password, update, invalidate token and sessions.
7. **JWT Authentication** — signed, expiration, user ID only, no sensitive data in claims. Reusable `get_current_user()` dependency.
8. **Protected Routes** — React `ProtectedRoute` component redirects to `/login`. Backend independently verifies JWT.
9. **Logout** — remove auth state, invalidate/revoke session, clear client state, redirect to `/login`.

---

## Backend API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| GET | `/api/auth/verify-email?token=...` | Verify email | No |
| POST | `/api/auth/resend-verification` | Resend verification email | No |
| POST | `/api/auth/login` | Sign in | No |
| GET | `/api/auth/google` | Initiate Google OAuth | No |
| GET | `/api/auth/google/callback` | Google OAuth callback | No |
| POST | `/api/auth/forgot-password` | Request password reset | No |
| POST | `/api/auth/reset-password` | Reset password with token | No |
| GET | `/api/auth/me` | Get current user | Yes |
| POST | `/api/auth/logout` | Logout | Yes |

---

## Frontend Routes

| Path | Page | Auth Required |
|------|------|---------------|
| `/signup` | Signup | No |
| `/login` | Login | No |
| `/verify` | Email Verification | No |
| `/forgot-password` | Forgot Password | No |
| `/reset-password` | Reset Password | No |
| `/protected-test` | Protected Test Page | Yes |
| `/` | Redirect to `/login` | No |

---

## Security Requirements

- Use HTTPS/TLS in production
- Argon2id password hashing (never plaintext)
- Never log passwords or secrets
- No sensitive data inside JWT claims
- Secure token generation (cryptographically random)
- Expiration for verification/reset tokens
- One-time use verification/reset tokens
- Configure CORS correctly
- Rate limiting on authentication endpoints
- Prevent account enumeration during forgot-password
- Validate all backend input using Pydantic (never trust frontend validation)
- Database constraints for invariants (unique email)
- Use environment variables for all secrets

---

## Implementation Order (24 Steps)

| Step | File/Module | Description |
|------|-------------|-------------|
| 1 | Project scaffolding | Directory structure, `package.json`, `requirements.txt`, `.env`, `docker-compose.yml`, `.gitignore` |
| 2 | `backend/app/models/user.py` | User SQLAlchemy model |
| 3 | Alembic migration | Generate and run initial migration |
| 4 | `backend/app/schemas/auth.py` | Pydantic request/response schemas |
| 5 | `backend/app/routers/auth.py` | Signup API endpoint |
| 6 | `frontend/src/pages/Signup.jsx` | Signup React page |
| 7 | `backend/app/security/tokens.py` | Verification token system |
| 8 | `backend/app/services/email.py` | Email sending service |
| 9 | `backend/app/routers/auth.py` | Verify email + resend endpoints |
| 10 | `frontend/src/pages/VerifyEmail.jsx` | Email verification React page |
| 11 | `backend/app/routers/auth.py` | Login API endpoint |
| 12 | `frontend/src/pages/Login.jsx` | Login React page |
| 13 | `backend/app/security/jwt.py` + `dependencies.py` | JWT generation and `get_current_user` |
| 14 | `backend/app/routers/auth.py` | Protected `/api/auth/me` endpoint |
| 15 | `frontend/src/components/ProtectedRoute.jsx` | React route guard |
| 16 | `backend/app/services/google.py` + router | Google OAuth backend |
| 17 | Frontend Google SSO button + callback | Google login UI |
| 18 | `backend/app/routers/auth.py` | Forgot password endpoint |
| 19 | `frontend/src/pages/ForgotPassword.jsx` | Forgot password React page |
| 20 | `backend/app/routers/auth.py` | Reset password endpoint |
| 21 | `frontend/src/pages/ResetPassword.jsx` | Reset password React page |
| 22 | Backend + Frontend logout | Logout implementation |
| 23 | Testing | Manual testing of all flows |
| 24 | Security hardening | CORS, rate limits, HTTPS config |

---

## Testing Matrix

### Signup
- Valid registration
- Invalid email format
- Weak password
- Duplicate email
- Empty fields

### Email Verification
- Valid token
- Expired token
- Invalid token
- Already used token
- Resend verification

### Sign In
- Correct credentials
- Incorrect password
- Unknown email
- Unverified email
- Inactive account

### Google SSO
- Successful login (new account)
- Successful login (existing account)
- Cancelled OAuth
- Invalid callback

### Forgot Password
- Existing email
- Unknown email
- Rate limiting

### Reset Password
- Valid token
- Expired token
- Invalid token
- Already used token
- Password mismatch
- Weak password

### JWT
- Valid token access
- Expired token
- Invalid token
- Missing token
- Tampered token

### Logout
- Successful logout
- Access protected route after logout (should fail)

---

## Request / Response Examples

### POST `/api/auth/register`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123"
}
```

**Response (201):**
```json
{
  "message": "Account created. Please verify your email.",
  "user_id": "uuid-string"
}
```

**Response (409):**
```json
{
  "detail": "An account with this email already exists."
}
```

### POST `/api/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123"
}
```

**Response (200):**
```json
{
  "access_token": "jwt-token-string",
  "token_type": "bearer",
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "is_email_verified": true
  }
}
```

### GET `/api/auth/me` (with `Authorization: Bearer <token>`)

**Response (200):**
```json
{
  "id": "uuid-string",
  "email": "user@example.com",
  "is_email_verified": true,
  "is_active": true,
  "auth_provider": "email",
  "created_at": "2026-08-27T10:00:00Z"
}
```
