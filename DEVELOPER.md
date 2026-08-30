# CreditPaper — Developer Guide

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend | Python 3.14 + FastAPI |
| Database | PostgreSQL 18 (asyncpg) |
| ORM | SQLAlchemy 2.0 (async) |
| Migrations | Alembic |
| Auth | JWT (PyJWT) + Argon2id + httpOnly cookies |
| Encryption | AES-256-GCM (application-level) |
| Email | Gmail SMTP (smtplib + background thread) |
| Validation | React Hook Form + Zod (frontend), Pydantic (backend) |
| Rate Limiting | SlowAPI |
| Design System | Inter font, prototype-matched UI |

---

## Project Structure

```
CreditPaper/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, rate limiter
│   │   ├── config.py            # Pydantic Settings (.env loader)
│   │   ├── database.py          # Async SQLAlchemy engine + session
│   │   ├── dependencies.py      # get_current_user() reads httpOnly cookie
│   │   ├── models/
│   │   │   └── user.py          # User SQLAlchemy model
│   │   ├── schemas/
│   │   │   └── auth.py          # Pydantic request/response schemas
│   │   ├── routers/
│   │   │   └── auth.py          # All auth API endpoints (encrypted)
│   │   ├── security/
│   │   │   ├── password.py      # Argon2id hash/verify
│   │   │   ├── jwt.py           # JWT create/decode
│   │   │   ├── tokens.py        # Verification token model + logic
│   │   │   └── encryption.py    # AES-256-GCM encrypt/decrypt
│   │   └── services/
│   │       ├── email.py         # SMTP email sending (Gmail)
│   │       └── google.py        # Google OAuth token exchange
│   ├── alembic/                 # Database migrations
│   ├── alembic.ini
│   ├── requirements.txt
│   └── .env                     # Environment variables
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Routes
│   │   ├── index.css            # Global styles (prototype-matched)
│   │   ├── main.jsx             # React entry point
│   │   ├── api/
│   │   │   └── auth.js          # API client (encrypted, credentials:include)
│   │   ├── utils/
│   │   │   └── encryption.js    # AES-256-GCM Web Crypto API
│   │   ├── components/
│   │   │   ├── PasswordInput.jsx    # Password field with toggle
│   │   │   └── ProtectedRoute.jsx   # Auth guard (cookie-based)
│   │   ├── styles/
│   │   │   └── dashboard.css    # Dashboard admin UI styles
│   │   └── pages/
│   │       ├── Signup.jsx           # Registration (logo outside card)
│   │       ├── Login.jsx            # Login (logo outside card)
│   │       ├── CheckEmail.jsx       # Post-registration info
│   │       ├── VerifyEmail.jsx      # Email verification handler
│   │       ├── ForgotPassword.jsx   # Forgot password form
│   │       ├── ResetPassword.jsx    # Reset password form
│   │       ├── AuthCallback.jsx     # OAuth callback (cookie-based)
│   │       ├── Dashboard.jsx        # Admin dashboard
│   │       └── ProtectedTest.jsx    # Protected content example
│   ├── vite.config.js          # Vite config + API proxy + cookie forwarding
│   ├── package.json
│   └── .env
└── PROJECT_PLAN.md
```

---

## Environment Variables (.env)

### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql+asyncpg://postgres:admin@localhost:5432/creditpaper

# JWT
JWT_SECRET_KEY=<random-64-char-string>
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# Gmail SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SMTP_FROM=your@gmail.com

# Google OAuth
GOOGLE_CLIENT_ID=<client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<client-secret>
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback

# Frontend
FRONTEND_URL=http://localhost:5173

# Encryption (AES-256-GCM)
ENCRYPTION_KEY=<base64-encoded-32-byte-key>
USE_ENCRYPTION=true
```

### Frontend (.env)
```bash
VITE_ENCRYPTION_KEY=<same-base64-key-as-backend>
VITE_USE_ENCRYPTION=true
```

---

## Encryption Layer

All API requests and responses are encrypted with **AES-256-GCM** when `USE_ENCRYPTION=true`.

### How It Works
```
Frontend                          Backend
   |                                |
   | 1. Encrypt payload (AES-256)   |
   |------------------------------>|
   |                                | 2. Decrypt payload
   |                                | 3. Process request
   | 4. Encrypt response            |
   |<------------------------------|
   | 5. Decrypt response            |
```

### Request Format
```json
{
  "data": "<base64-encoded-nonce+ciphertext>"
}
```

### Response Format
```json
{
  "data": "<base64-encoded-nonce+ciphertext>"
}
```

### Key Management
- Key is cached in memory after first load
- Same key used for all encrypt/decrypt operations
- Key loaded from `ENCRYPTION_KEY` env var (base64-encoded 32 bytes)

---

## Authentication Flow

### Token Storage
- **JWT stored in httpOnly cookie** (not localStorage)
- Cookie attributes: `httponly=true`, `secure=false` (dev), `samesite=lax`, `max_age=1800`
- Browser sends cookie automatically with `credentials: 'include'`
- Backend reads token from `request.cookies.get("access_token")`

### Email/Password Registration
```
1. POST /api/auth/register (encrypted)
   → Decrypt payload → {email, password}
   → Check duplicate email → 409 "Already exists"
   → Extract domain from email
   → Check if domain is free provider (gmail, yahoo, etc.) → skip if yes
   → Check if domain is already claimed → 403 "Contact admin at {admin_email}"
   → If new domain → create domain record (domain claimed)
   → Hash password (Argon2id)
   → Create user (is_email_verified=false)
   → Generate verification token
   → Send verification email (background thread)
   → Return 201 + user_id (encrypted)

2. GET /api/auth/verify-email?token=xxx
   → Find token in DB (not used, not expired)
   → If already used + email verified → "Email already verified"
   → Mark token as used, set is_email_verified=true
   → Return "Email verified successfully"

3. POST /api/auth/login (encrypted)
   → Find user by email → 404 "No account found"
   → Verify password → 401 "Incorrect password"
   → Check is_active → 403 "Account deactivated"
   → Check is_email_verified → 403 "Please verify email"
   → Generate JWT (30min expiry)
   → Set httpOnly cookie + return user info (encrypted)

4. POST /api/auth/logout
   → Clear access_token cookie
   → Return "Logged out"
```

### Google SSO
```
1. GET /api/auth/google
   → Build Google OAuth URL → Redirect to accounts.google.com

2. Google redirects to /api/auth/google/callback?code=xxx
   → Exchange code for access token
   → Fetch user info from Google
   → Create/find user → Generate JWT
   → Set httpOnly cookie → Redirect to /dashboard
```

### Password Reset
```
1. POST /api/auth/forgot-password (encrypted)
   → Find user → Generate reset token (1h expiry)
   → Send reset email → Return success message

2. POST /api/auth/reset-password (encrypted)
   → Verify token → Hash new password → Update user
   → Return "Password reset successfully"
```

---

## Database Schema

### users
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| email | VARCHAR (unique) | User email |
| password_hash | VARCHAR (nullable) | Argon2id hash (null for Google users) |
| is_email_verified | BOOLEAN | Default: false |
| is_active | BOOLEAN | Default: true |
| auth_provider | VARCHAR | "email" or "google" |
| created_at | TIMESTAMP | Auto-set on creation |
| updated_at | TIMESTAMP | Auto-updated |

### verification_tokens
| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR (PK) | Random token ID |
| user_id | UUID (FK) | References users.id |
| token | VARCHAR (unique) | The verification token |
| token_type | VARCHAR | "email_verification" or "password_reset" |
| expires_at | TIMESTAMP | 15 min for verification, 15 min for reset |
| used | BOOLEAN | One-time use flag |

### domains
| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR (PK) | Auto-generated |
| domain | VARCHAR (unique) | Claimed domain (e.g., "apple.com") |
| admin_email | VARCHAR | Email of first user who claimed it |
| created_at | TIMESTAMP | When claimed |

**Free providers excluded:** gmail.com, yahoo.com, outlook.com, hotmail.com, live.com, aol.com, icloud.com, protonmail.com, zoho.com, yandex.com, mail.com, gmx.com, fastmail.com, tutanota.com, qq.com, 163.com

---

## API Endpoints

### Auth Endpoints (All encrypted when USE_ENCRYPTION=true)

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/api/auth/register` | Register new user (includes domain check) | 5/min |
| GET | `/api/auth/verify-email?token=` | Verify email | — |
| POST | `/api/auth/resend-verification?email=` | Resend verification email | — |
| POST | `/api/auth/login` | Login (sets httpOnly cookie) | 10/min |
| POST | `/api/auth/logout` | Logout (clears cookie) | — |
| GET | `/api/auth/me` | Get current user (cookie auth) | — |
| POST | `/api/auth/forgot-password` | Request password reset | 3/min |
| POST | `/api/auth/reset-password` | Reset password with token | 5/min |
| GET | `/api/auth/google` | Redirect to Google OAuth | — |
| GET | `/api/auth/google/callback?code=` | Google OAuth callback | — |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Returns `{"status": "ok"}` |

---

## Security Features

- **Application-level encryption:** AES-256-GCM on all API requests/responses
- **Password hashing:** Argon2id (memory-hard, resistant to GPU attacks)
- **JWT in httpOnly cookie:** Not accessible by JavaScript, immune to XSS
- **Cookie security:** SameSite=Lax, httponly, configurable secure flag
- **Rate limiting:** SlowAPI on all sensitive endpoints
- **One-time tokens:** Verification/reset tokens marked as used after use
- **CORS:** Restricted to frontend URL only
- **Token expiry:** 30min JWT, 15min email verification, 15min password reset
- **Double-click safe:** Already-verified email returns success, not error
- **Clear error messages:** Users know exactly what went wrong

---

## Vite Proxy Configuration

The frontend proxies `/api` requests to the backend with cookie forwarding:

```js
// vite.config.js
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
    configure: (proxy) => {
      proxy.on('proxyRes', (proxyRes) => {
        const cookies = proxyRes.headers['set-cookie']
        if (cookies) {
          proxyRes.headers['set-cookie'] = cookies.map((cookie) =>
            cookie.replace(/; secure/gi, '').replace(/; SameSite=\w+/gi, '; SameSite=Lax')
          )
        }
      })
    },
  },
}
```

---

## Running the Application

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
alembic upgrade head         # Run migrations
set ENCRYPTION_KEY=<your-key>  # Windows
uvicorn app.main:app --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev                  # Runs on http://localhost:5173
```

---

## Key Design Decisions

1. **Application-level encryption:** AES-256-GCM on all API payloads for extra security layer
2. **httpOnly cookies:** JWT stored in httpOnly cookie, not localStorage (XSS-safe)
3. **Async everything:** Database operations use asyncpg + SQLAlchemy async
4. **Threaded email:** SMTP sending runs in background thread
5. **Console fallback:** If SMTP fails, links print to server console
6. **Token format:** `secrets.token_urlsafe(48)` — URL-safe, 64 characters
7. **Prototype-matched UI:** All auth pages match the HTML prototype design
8. **Logo outside card:** Brand mark + text positioned above the card, not inside
