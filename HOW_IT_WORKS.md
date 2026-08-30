# CreditPaper — How It Works

## High-Level Overview

CreditPaper is a web application with **React frontend**, **FastAPI backend**, and **PostgreSQL database**. All API communication is encrypted with AES-256-GCM, and authentication uses JWT tokens stored in httpOnly cookies.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER                                  │
│                                                                 │
│  ┌─────────────┐    ┌──────────────────────────────────────┐   │
│  │  React UI   │───▶│  httpOnly Cookie (JWT)                │   │
│  │  (Vite)     │    │  - Auto-sent with every request       │   │
│  │             │    │  - Not accessible by JavaScript        │   │
│  │  Encrypts:  │    │  - Expires in 30 minutes              │   │
│  │  AES-256-GCM│    └──────────────────────────────────────┘   │
│  └──────┬──────┘                                                │
└─────────┼───────────────────────────────────────────────────────┘
          │ HTTP Request (credentials: 'include')
          │ /api/auth/...
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VITE DEV SERVER (port 5173)                  │
│                                                                 │
│  Proxy: /api → localhost:8000                                   │
│  - Forwards Set-Cookie headers                                  │
│  - Strips "secure" flag for dev                                 │
│  - Sets SameSite=Lax                                            │
└─────────────────────────┬───────────────────────────────────────┘
                          │ Proxied Request
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  FASTAPI BACKEND (port 8000)                    │
│                                                                 │
│  1. Receive encrypted request                                   │
│  2. Decrypt payload (AES-256-GCM)                               │
│  3. Validate input (Pydantic schemas)                           │
│  4. Read JWT from httpOnly cookie                               │
│  5. Query PostgreSQL database                                   │
│  6. Execute business logic                                      │
│  7. Encrypt response (AES-256-GCM)                              │
│  8. Return encrypted JSON + Set-Cookie header                   │
└─────────────────────────┬───────────────────────────────────────┘
                          │ asyncpg (async connection pool)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   POSTGRESQL DATABASE (port 5432)               │
│                                                                 │
│  ┌─────────────────────┐    ┌─────────────────────────────┐    │
│  │     users            │    │   verification_tokens       │    │
│  ├─────────────────────┤    ├─────────────────────────────┤    │
│  │ id (UUID, PK)       │◄───│ user_id (UUID, FK)          │    │
│  │ email (unique)      │    │ id (VARCHAR, PK)            │    │
│  │ password_hash       │    │ token (unique)              │    │
│  │ is_email_verified   │    │ token_type                  │    │
│  │ is_active           │    │ expires_at                  │    │
│  │ auth_provider       │    │ used                        │    │
│  │ created_at          │    └─────────────────────────────┘    │
│  │ updated_at          │                                       │
│  └─────────────────────┘    ┌─────────────────────────────┐    │
│                             │      domains                 │    │
│                             ├─────────────────────────────┤    │
│                             │ id (VARCHAR, PK)            │    │
│                             │ domain (unique)             │    │
│                             │ admin_email                 │    │
│                             │ created_at                  │    │
│                             └─────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Flows

### Flow 1: User Signup

```
STEP 1: User opens /signup
        React renders Signup.jsx

STEP 2: User fills form (email + password)
        React Hook Form validates with Zod

STEP 3: Frontend encrypts payload
        encrypt({email, password}) → AES-256-GCM → base64 string

STEP 4: POST /api/auth/register
        {data: "encrypted-base64-string"}

STEP 5: Vite proxy forwards to backend
        /api/auth/register → localhost:8000/api/auth/register

STEP 6: Backend receives request
        FastAPI route → decrypt payload → {email, password}

STEP 7: Backend checks database
        SELECT * FROM users WHERE email = 'user@example.com'

STEP 8: Email exists? → YES → Return 409 "Already exists"
                          NO  → Continue

STEP 9: Extract domain from email
        user@example.com → example.com

STEP 10: Check if domain is free provider
         (gmail.com, yahoo.com, outlook.com, etc.)
         → YES → Skip domain check
         → NO  → Continue

STEP 11: Check if domain is already claimed
         SELECT * FROM domains WHERE domain = 'example.com'
         → Claimed → Return 403 "Contact admin at {admin_email}"
         → Not claimed → Create domain record

STEP 12: Hash password
         Argon2id hash → $argon2id$v=19$m=65536,t=3,p=4$...

STEP 13: Save to database
         INSERT INTO users (email, password_hash, auth_provider)
         VALUES ('user@example.com', '$argon2id$...', 'email')

STEP 14: Generate verification token
         secrets.token_urlsafe(48) → "abc123..."

STEP 15: Save token to database
         INSERT INTO verification_tokens (user_id, token, token_type, expires_at)
         VALUES ('uuid', 'abc123...', 'email_verification', now() + 15min)

STEP 16: Send verification email
         threading.Thread → smtplib → Gmail SMTP
         Email contains link: /verify?token=abc123...

STEP 17: Backend encrypts response
         encrypt({message, user_id}) → AES-256-GCM → base64 string

STEP 18: Return 201 to frontend
         + Set-Cookie header (not used for signup, used for login)

STEP 19: Frontend decrypts response
         decrypt(base64) → {message, user_id}

STEP 20: Frontend navigates to /check-email
         Shows "We sent a link to user@example.com"
```

---

### Flow 2: Email Verification

```
STEP 1: User clicks link in email
        Browser opens /verify?token=abc123...

STEP 2: Frontend calls backend
        GET /api/auth/verify-email?token=abc123...

STEP 3: Backend finds token in database
        SELECT * FROM verification_tokens
        WHERE token = 'abc123...'
        AND token_type = 'email_verification'
        AND used = false
        AND expires_at > now()

STEP 4: Token not found? → Return 400 "Invalid or expired token"
        Token found → Continue

STEP 5: Mark token as used
         UPDATE verification_tokens SET used = true WHERE token = 'abc123...'

STEP 6: Mark email as verified
         UPDATE users SET is_email_verified = true WHERE id = 'uuid'

STEP 7: Return success
         {message: "Email verified successfully"}

STEP 8: Frontend shows green checkmark + "Sign in" button
```

---

### Flow 3: User Login

```
STEP 1: User opens /login
        React renders Login.jsx

STEP 2: User fills form (email + password)
        React Hook Form validates

STEP 3: Frontend encrypts payload
        encrypt({email, password}) → AES-256-GCM → base64 string

STEP 4: POST /api/auth/login
        {data: "encrypted-base64-string"}

STEP 5: Backend decrypts payload
        → {email, password}

STEP 6: Find user in database
        SELECT * FROM users WHERE email = 'user@example.com'

STEP 7: User not found? → Return 404 "No account found"
        User found → Continue

STEP 8: Verify password
        Argon2id verify(password, stored_hash)
        Wrong? → Return 401 "Incorrect password"

STEP 9: Check account status
        is_active = false? → Return 403 "Account deactivated"
        is_email_verified = false? → Return 403 "Please verify email"

STEP 10: Generate JWT token
         jwt.encode({user_id, email, exp: now+30min}, secret_key)

STEP 11: Set httpOnly cookie
         Set-Cookie: access_token=eyJhbG...; HttpOnly; SameSite=Lax; Path=/

STEP 12: Backend encrypts response
         encrypt({user: {id, email, is_verified}}) → AES-256-GCM

STEP 13: Return 200 to frontend
         + Set-Cookie header

STEP 14: Browser stores cookie automatically
         Cookie: access_token=eyJhbG... (httpOnly, not accessible by JS)

STEP 15: Frontend redirects to /dashboard
```

---

### Flow 4: Accessing Protected Page

```
STEP 1: User opens /dashboard
        React renders Dashboard.jsx

STEP 2: ProtectedRoute component checks auth
        Calls GET /api/auth/me

STEP 3: Browser sends request with cookie
        Cookie: access_token=eyJhbG...
        credentials: 'include' in fetch()

STEP 4: Backend reads token from cookie
        token = request.cookies.get("access_token")

STEP 5: Decode JWT
        jwt.decode(token, secret_key) → {user_id, email, exp}

STEP 6: Check expiry
        exp < now? → Return 401 "Token expired"

STEP 7: Find user in database
        SELECT * FROM users WHERE id = 'uuid'

STEP 8: User not found? → Return 401 "User not found"
        User found → Continue

STEP 9: Backend encrypts response
         encrypt({user: {id, email, is_verified}}) → AES-256-GCM

STEP 10: Return 200 with encrypted user data

STEP 11: Frontend decrypts response
          → {user: {id, email, is_verified}}

STEP 12: ProtectedRoute allows access
          Renders Dashboard with user info
```

---

### Flow 5: Password Reset

```
STEP 1: User clicks "Forgot password?" on /login
        Navigates to /forgot-password

STEP 2: User enters email
        POST /api/auth/forgot-password
        {data: "encrypted({email})"}

STEP 3: Backend finds user
        SELECT * FROM users WHERE email = 'user@example.com'

STEP 4: User not found? → Return 404 "No account found"
        Google user? → Return 400 "Use Google login"
        Found → Continue

STEP 5: Generate reset token
         secrets.token_urlsafe(48) → "xyz789..."

STEP 6: Save token to database
         INSERT INTO verification_tokens (user_id, token, token_type, expires_at)
         VALUES ('uuid', 'xyz789...', 'password_reset', now() + 15min)

STEP 7: Send reset email
         threading.Thread → smtplib → Gmail SMTP
         Email contains link: /reset-password?token=xyz789...

STEP 8: Return success
         {message: "A password reset link has been sent"}

STEP 9: User clicks link in email
        Navigates to /reset-password?token=xyz789...

STEP 10: User enters new password
         POST /api/auth/reset-password
         {data: "encrypted({token, password})"}

STEP 11: Backend finds token
          SELECT * FROM verification_tokens
          WHERE token = 'xyz789...'
          AND token_type = 'password_reset'
          AND used = false
          AND expires_at > now()

STEP 12: Token invalid? → Return 400 "Link expired or used"
          Token valid → Continue

STEP 13: Hash new password
          Argon2id hash → new hash

STEP 14: Update user password
          UPDATE users SET password_hash = '$argon2id$...' WHERE id = 'uuid'

STEP 15: Mark token as used
          UPDATE verification_tokens SET used = true WHERE token = 'xyz789...'

STEP 16: Return success
          {message: "Password reset successfully"}

STEP 17: Frontend shows "Sign in" button
          User logs in with new password
```

---

### Flow 6: Google SSO

```
STEP 1: User clicks "Continue with Google"
        Frontend navigates to /api/auth/google

STEP 2: Backend builds Google OAuth URL
        https://accounts.google.com/o/oauth2/v2/auth?
        client_id=...&
        redirect_uri=http://localhost:8000/api/auth/google/callback&
        scope=openid email profile&
        response_type=code

STEP 3: Browser redirects to Google
        User signs in with Google account

STEP 4: Google redirects back with code
        /api/auth/google/callback?code=4/0Axx...

STEP 5: Backend exchanges code for tokens
        POST https://oauth2.googleapis.com/token
        {code, client_id, client_secret} → {access_token}

STEP 6: Backend fetches user info
        GET https://www.googleapis.com/oauth2/v2/userinfo
        Authorization: Bearer {access_token}
        → {email, name}

STEP 7: Check if user exists
        SELECT * FROM users WHERE email = 'user@gmail.com'

STEP 8: User exists + password user? → Return 409 "Use email login"
        User exists + Google user? → Continue (login)
        User doesn't exist → Create new user

STEP 9: Create new user (if needed)
         INSERT INTO users (email, auth_provider, is_email_verified)
         VALUES ('user@gmail.com', 'google', true)

STEP 10: Generate JWT token
          jwt.encode({user_id, email, exp: now+30min}, secret_key)

STEP 11: Set httpOnly cookie
          Set-Cookie: access_token=eyJhbG...; HttpOnly; SameSite=Lax

STEP 12: Redirect to /dashboard
          Browser follows redirect, sends cookie

STEP 13: Dashboard loads, checks /api/auth/me
          Cookie → JWT → User info → Dashboard renders
```

---

## Encryption Flow (Every Request)

```
┌─────────────────────────────────────────────────────────────┐
│                       FRONTEND                              │
│                                                             │
│  1. User submits form                                       │
│  2. plaintext = {email: "user@example.com", password: "..."}│
│  3. ciphertext = AES-GCM-Encrypt(plaintext, key)           │
│  4. base64 = btoa(ciphertext)                               │
│  5. POST /api/auth/login {data: base64}                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                              │
│                                                             │
│  1. Receive {data: base64}                                  │
│  2. ciphertext = atob(base64)                               │
│  3. plaintext = AES-GCM-Decrypt(ciphertext, key)           │
│  4. {email, password} = JSON.parse(plaintext)               │
│  5. Process request...                                      │
│  6. response = {user: {id, email}}                          │
│  7. ciphertext = AES-GCM-Encrypt(response, key)            │
│  8. base64 = btoa(ciphertext)                               │
│  9. Return {data: base64}                                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       FRONTEND                              │
│                                                             │
│  1. Receive {data: base64}                                  │
│  2. ciphertext = atob(base64)                               │
│  3. plaintext = AES-GCM-Decrypt(ciphertext, key)           │
│  4. {user} = JSON.parse(plaintext)                          │
│  5. Render UI with user data                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Cookie Flow (Authentication)

```
┌─────────────────────────────────────────────────────────────┐
│                    LOGIN REQUEST                             │
│                                                             │
│  POST /api/auth/login                                       │
│  Body: {data: "encrypted..."}                               │
│  Cookie: (empty - first time)                               │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    LOGIN RESPONSE                            │
│                                                             │
│  HTTP/1.1 200 OK                                           │
│  Set-Cookie: access_token=eyJhbG...;                        │
│              HttpOnly;                                      │
│              SameSite=Lax;                                  │
│              Path=/;                                        │
│              Max-Age=1800                                   │
│  Body: {data: "encrypted..."}                               │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 SUBSEQUENT REQUESTS                          │
│                                                             │
│  GET /api/auth/me                                           │
│  Cookie: access_token=eyJhbG...                             │
│                                                             │
│  Browser automatically sends cookie                         │
│  Backend reads: request.cookies.get("access_token")         │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Operations Summary

| Operation | SQL Query | When Used |
|-----------|-----------|-----------|
| Create user | `INSERT INTO users` | Signup, Google SSO |
| Find user by email | `SELECT * FROM users WHERE email = ?` | Login, Forgot password |
| Find user by ID | `SELECT * FROM users WHERE id = ?` | Get current user |
| Verify email | `UPDATE users SET is_email_verified = true` | Email verification |
| Update password | `UPDATE users SET password_hash = ?` | Password reset |
| Deactivate user | `UPDATE users SET is_active = false` | Admin action |
| Create token | `INSERT INTO verification_tokens` | Signup, Forgot password |
| Find valid token | `SELECT * FROM verification_tokens WHERE token = ? AND used = false AND expires_at > now()` | Verify email, Reset password |
| Mark token used | `UPDATE verification_tokens SET used = true` | Verify email, Reset password |
| Check domain claimed | `SELECT * FROM domains WHERE domain = ?` | Signup, Google SSO |
| Claim domain | `INSERT INTO domains (domain, admin_email)` | First user from new domain |

---

## Key Files

| File | Purpose |
|------|---------|
| `backend/app/main.py` | FastAPI app, CORS, rate limiter |
| `backend/app/config.py` | Environment variables (Settings) |
| `backend/app/database.py` | PostgreSQL connection pool |
| `backend/app/dependencies.py` | `get_current_user()` - reads JWT from cookie |
| `backend/app/routers/auth.py` | All API endpoints |
| `backend/app/security/encryption.py` | AES-256-GCM encrypt/decrypt |
| `backend/app/security/password.py` | Argon2id hash/verify |
| `backend/app/security/jwt.py` | JWT create/decode |
| `backend/app/security/tokens.py` | Verification token CRUD |
| `backend/app/services/email.py` | Gmail SMTP (background thread) |
| `backend/app/services/google.py` | Google OAuth exchange |
| `frontend/src/api/auth.js` | API client (encrypted, cookie-based) |
| `frontend/src/utils/encryption.js` | Web Crypto AES-256-GCM |
| `frontend/src/components/ProtectedRoute.jsx` | Auth guard |
| `frontend/src/pages/*.jsx` | UI pages |
| `frontend/vite.config.js` | Vite proxy + cookie forwarding |

---

## Quick Reference

```
FRONTEND          BACKEND           DATABASE
   │                 │                 │
   │──encrypt───────▶│                 │
   │                 │──decrypt───────▶│
   │                 │──query─────────▶│
   │                 │◀──result────────│
   │◀──encrypt───────│                 │
   │──decrypt───────▶│                 │
```

**Every request:** Frontend encrypts → Backend decrypts → Database query → Backend encrypts → Frontend decrypts

**Authentication:** JWT in httpOnly cookie → Browser auto-sends → Backend reads from cookie → Decodes JWT → Finds user
