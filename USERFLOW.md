# CreditPaper — User Flow Guide

## Overview

This guide shows the step-by-step experience for each feature in CreditPaper.

---

## 1. Sign Up

### Step 1: Open Signup Page
- Go to `http://localhost:5173/signup`
- You see the **Create Account** page with:
  - CreditPaper logo + brand name (outside card)
  - "Continue with Google" outline button
  - "or" divider with lines
  - Work email field
  - Password field
  - "Create account" button
  - "Already have an account? Sign in" (inside card)

### Step 2: Fill in Details
- Enter your **work email address**
- Enter a **password** (must have: 8+ characters, uppercase, lowercase, number)
- Click **"Create account"**

### Possible Outcomes

| Situation | What You See |
|-----------|-------------|
| Success | "Confirm your email" page |
| Email already exists | "An account with this email already exists. Please sign in instead." |
| Too many attempts | "Too many requests. Please try again later." |

### Step 3: Check Your Email
- You see a **"Confirm your email"** page
- Message: "We sent a link to your@email.com. Open it to continue."
- Go to your **Gmail inbox** (check spam folder too)

### Step 4: Verify Email
- Open the email from **CreditPaper**
- Click the **"Verify Email"** button
- You see a **spinner** while verifying
- Then a **green checkmark** with "Email verified"
- Click **"Sign in"**

### Step 5: Sign In
- Enter your email and password
- Click **"Sign In"**
- You're logged in! Redirected to dashboard.

---

## 2. Login

### Step 1: Open Login Page
- Go to `http://localhost:5173/login`
- You see the **Sign In** page with:
  - CreditPaper logo + brand name (outside card)
  - "Continue with Google" outline button
  - "or" divider with lines
  - Email field
  - Password field
  - "Sign in" button
  - "Forgot password?" link
  - "No account yet? Sign up" (inside card)

### Step 2: Enter Credentials
- Enter your **email** and **password**
- Click **"Sign in"**

### Possible Outcomes

| Situation | What You See |
|-----------|-------------|
| Success | Redirected to dashboard |
| Email not found | "No account found with this email. Please sign up first." |
| Wrong password | "Incorrect password. Please try again or reset your password." |
| Email not verified | "Please verify your email before signing in. Check your inbox for the verification link." |
| Account deactivated | "Your account has been deactivated. Please contact support." |
| Too many attempts | "Too many requests. Please try again later." |

---

## 3. Forgot Password

### Step 1: Click "Forgot password?"
- On the login page, click **"Forgot password?"**
- You see the **Reset your password** page

### Step 2: Enter Email
- Enter your **email address**
- Click **"Send reset link"**

### Possible Outcomes

| Situation | What You See |
|-----------|-------------|
| Email exists | "A password reset link has been sent to your email. Please check your inbox and spam folder." |
| Email not found | "No account found with this email. Please sign up first." |
| Google account | "This account uses Google Sign-In. Please login with Google instead." |
| Too many attempts | "Too many requests. Please try again later." |

### Step 3: Check Email
- Open the email from **CreditPaper**
- Click the **"Reset Password"** button
- You see the **Choose a new password** form

### Step 4: Set New Password
- Enter your **new password**
- **Confirm** the new password
- Click **"Update password"**

### Possible Outcomes

| Situation | What You See |
|-----------|-------------|
| Success | "Password reset successfully" + Sign in button |
| Link expired | "This reset link has expired or already been used. Please request a new one." |

### Step 5: Login with New Password
- Enter your email and **new password**
- You're logged in! Redirected to dashboard.

---

## 4. Google Sign-In

### Step 1: Click "Continue with Google"
- On the login or signup page, click **"Continue with Google"**
- You're redirected to **Google's sign-in page**

### Step 2: Sign in with Google
- Enter your **Google email** and **password**
- Click **"Allow"** to grant access

### Possible Outcomes

| Situation | What You See |
|-----------|-------------|
| Success | Redirected to dashboard (httpOnly cookie set) |
| Email already has password | "An account with this email already exists using email/password. Please login with your email and password instead." |
| Google error | "Google sign-in failed. Please try again or use email/password login." |

### Step 3: Redirect Back
- If new user → account created automatically (verified)
- If existing user → logged in directly
- You see the admin dashboard

---

## 5. Dashboard

### Accessing Dashboard
- After login, you're redirected to `http://localhost:5173/dashboard`

### What You See
- **Sidebar** with navigation:
  - CreditPaper logo
  - Dashboard (active)
  - Transactions
  - Companies
  - Contacts
  - Reports
  - Settings
- **Main content area**:
  - Summary cards (Total Revenue, Companies, Contacts, Transactions)
  - Revenue chart (Line + Bar)
  - Recent activity table
  - Status distribution donut chart
- **Top bar** with user email and Logout button

---

## 6. Logout

### Step 1: Click "Logout"
- On the dashboard, click the **"Logout"** button in the top right
- You're logged out and redirected to the **login page**

### What Happens
- The httpOnly cookie is cleared (POST to `/api/auth/logout`)
- You need to login again to access protected pages

---

## Flow Diagrams

### Complete Registration Flow
```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Signup   │────▶│  Check   │────▶│  Email   │────▶│ Verified │
│   Page    │     │  Email   │     │  Inbox   │     │   Page   │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                                             │
     │                                             ▼
     │                                       ┌──────────┐
     └──────────────────────────────────────▶│  Login   │
                                             │   Page   │
                                             └──────────┘
```

### Login Flow
```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Login   │────▶│  Verify  │────▶│Dashboard │
│   Page   │     │  Auth    │     │          │
└──────────┘     └──────────┘     └──────────┘
     │                │
     │                ▼
     │          ┌──────────┐
     │          │  Error   │
     │          │  Page    │
     └─────────▶│          │
                └──────────┘
```

### Password Reset Flow
```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Login   │────▶│  Forgot  │────▶│  Email   │────▶│  Reset   │
│   Page   │     │ Password │     │  Inbox   │     │ Password │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                                           │
                                                           ▼
                                                     ┌──────────┐
                                                     │  Login   │
                                                     │   Page   │
                                                     └──────────┘
```

---

## Page URLs

| Page | URL |
|------|-----|
| Login | `http://localhost:5173/login` |
| Signup | `http://localhost:5173/signup` |
| Check Email | `http://localhost:5173/check-email` |
| Verify Email | `http://localhost:5173/verify?token=xxx` |
| Forgot Password | `http://localhost:5173/forgot-password` |
| Reset Password | `http://localhost:5173/reset-password?token=xxx` |
| Dashboard | `http://localhost:5173/dashboard` |
| Protected Page | `http://localhost:5173/protected-test` |
| Google OAuth | `http://localhost:8000/api/auth/google` |

---

## All Error Messages

### Registration
| Error | Solution |
|-------|----------|
| "An account with this email already exists. Please sign in instead." | Login instead |
| "Too many requests. Please try again later." | Wait a few minutes |

### Login
| Error | Solution |
|-------|----------|
| "No account found with this email. Please sign up first." | Sign up first |
| "Incorrect password. Please try again or reset your password." | Try again or reset password |
| "Please verify your email before signing in. Check your inbox for the verification link." | Check inbox |
| "Your account has been deactivated. Please contact support." | Contact support |
| "Too many requests. Please try again later." | Wait a few minutes |

### Forgot Password
| Error | Solution |
|-------|----------|
| "No account found with this email. Please sign up first." | Sign up first |
| "This account uses Google Sign-In. Please login with Google instead." | Use Google login |
| "A password reset link has been sent to your email. Please check your inbox and spam folder." | Check inbox |

### Reset Password
| Error | Solution |
|-------|----------|
| "This reset link has expired or already been used. Please request a new one." | Request new link |

### Verify Email
| Error | Solution |
|-------|----------|
| "Email verified successfully." | Click Sign In |
| "Email already verified." | Click Sign In |
| "Invalid or expired verification token." | Request new verification email |

### Google SSO
| Error | Solution |
|-------|----------|
| "Google sign-in failed. Please try again or use email/password login." | Try again |
| "Could not retrieve email from Google. Please try again." | Try again |
| "An account with this email already exists using email/password. Please login with your email and password instead." | Use email/password login |

---

## Password Requirements

- Minimum **8 characters**
- At least **1 uppercase** letter (A-Z)
- At least **1 lowercase** letter (a-z)
- At least **1 number** (0-9)

**Example:** `MyPassword1`

---

## Security Notes

- **JWT stored in httpOnly cookie** — not accessible by JavaScript
- **All API payloads encrypted** with AES-256-GCM
- **SameSite=Lax** — cookies sent with top-level navigation
- **CORS** — only `http://localhost:5173` allowed
- **Rate limiting** — prevents brute force attacks
