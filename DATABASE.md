# CreditPaper — Database Guide

## Overview

CreditPaper uses **PostgreSQL 18** with **SQLAlchemy 2.0 (async)** and **Alembic** for migrations. The database is accessed asynchronously via `asyncpg`.

**Connection:** `postgresql+asyncpg://postgres:admin@localhost:5432/creditpaper`

---

## Tables

### 1. users

The core table that stores all user accounts — both email/password users and Google SSO users.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | `gen_random_uuid()` | Primary key. UUID used instead of integer to prevent enumeration attacks and support distributed systems. |
| email | VARCHAR(255) | No | — | User's email address. Unique constraint prevents duplicate registrations. Used for login, notifications, and firm identification. |
| password_hash | VARCHAR(255) | Yes | `NULL` | Argon2id hash of the password. Nullable because Google SSO users don't have a password — they authenticate via Google's OAuth flow. |
| is_email_verified | BOOLEAN | No | `false` | Tracks whether the user has clicked the verification link sent to their email. Unverified users cannot login (403 error). Prevents fake signups. |
| is_active | BOOLEAN | No | `true` | Soft-delete flag. Deactivated accounts are blocked from login (403 error) but their data is preserved for audit/history. Admins can deactivate without losing data. |
| auth_provider | VARCHAR(20) | No | `'email'` | Identifies how the user authenticated: `"email"` (password) or `"google"` (OAuth). Used to show appropriate login errors — e.g., if a Google user tries password login, we say "use Google instead". |
| created_at | TIMESTAMP | No | `now()` | When the account was created. Used for audit trails, analytics, and display (e.g., "Member since Jan 2026"). |
| updated_at | TIMESTAMP | No | `now()` | Last modification timestamp. Auto-updates on any change via SQLAlchemy `onupdate`. Useful for cache invalidation and audit. |

#### Why These Columns?

| Column | Reason |
|--------|--------|
| `id` (UUID) | Prevents ID guessing attacks. No sequential IDs exposed to client. |
| `email` (unique) | Single source of truth for user identity. One account per email. |
| `password_hash` (nullable) | Supports both password and OAuth users in same table. No separate OAuth table needed. |
| `is_email_verified` | Required for COPPA/GDPR compliance. Prevents spam signups. Blocks unverified users from accessing the app. |
| `is_active` | Soft delete preserves data integrity. Foreign keys don't break. Allows account recovery. |
| `auth_provider` | Controls login flow logic. Prevents confusion between password and OAuth accounts. |
| `created_at` | Business intelligence. Know when users joined. |
| `updated_at` | Debugging. Know when record last changed. |

#### Indexes
| Index | Columns | Purpose |
|-------|---------|---------|
| `ix_users_id` | `id` | Primary key lookup (default) |
| `ix_users_email` | `email` | Fast login lookups. Email is used in every login/forgot-password query. |

---

### 2. domains

Tracks claimed email domains. When the first user from a domain registers, that domain is claimed. Subsequent registrations from the same domain are blocked.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | VARCHAR(36) | No | `uuid()` | Primary key. |
| domain | VARCHAR(255) | No | — | The claimed domain (e.g., `apple.com`). Unique constraint prevents double-claiming. |
| admin_email | VARCHAR(255) | No | — | Email of the first user who claimed the domain. Shown in error message when blocked users try to register. |
| created_at | TIMESTAMP | No | `now()` | When the domain was claimed. |

#### Why These Columns?

| Column | Reason |
|--------|--------|
| `id` | Internal record identifier. |
| `domain` (unique) | One claim per domain. First-come-first-served. |
| `admin_email` | So blocked users know who to contact. Displayed in the error message. |
| `created_at` | Audit trail. Know when domain was claimed. |

#### Free Providers (Excluded from Domain Check)
```
gmail.com, googlemail.com, yahoo.com, yahoo.co.in,
outlook.com, hotmail.com, live.com, aol.com,
icloud.com, me.com, protonmail.com, proton.me,
zoho.com, yandex.com, mail.com, gmx.com,
fastmail.com, tutanota.com, qq.com, 163.com
```

Anyone registering with these domains skips domain validation entirely.

#### Indexes
| Index | Columns | Purpose |
|-------|---------|---------|
| `ix_domains_id` | `id` | Primary key lookup (default) |
| `ix_domains_domain` | `domain` | Fast lookup during registration. Unique constraint also prevents race conditions. |

---

### 3. verification_tokens

Stores one-time-use tokens for email verification and password reset. Tokens are time-limited and marked as used after consumption.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | VARCHAR(255) | No | — | Primary key. Random identifier for the token record (separate from the token itself). Used for internal DB lookups. |
| user_id | UUID (FK) | No | — | References `users.id`. Links the token to a specific user. ON DELETE CASCADE ensures tokens are cleaned up if user is deleted. |
| token | VARCHAR(255) | No | — | The actual token sent to the user via email. Generated with `secrets.token_urlsafe(48)` — URL-safe, 64 characters. Unique constraint prevents token collisions. |
| token_type | VARCHAR(20) | No | — | Distinguishes between `"email_verification"` and `"password_reset"`. Same table, different expiry times and behaviors. |
| expires_at | TIMESTAMP | No | — | When the token becomes invalid. 15 minutes for both email verification and password reset. Prevents stale tokens from being used. |
| used | BOOLEAN | No | `false` | One-time use flag. Set to `true` after successful use. Prevents token replay attacks. |

#### Why These Columns?

| Column | Reason |
|--------|--------|
| `id` | Internal record identifier. Allows efficient DB operations without exposing the actual token. |
| `user_id` | Links token to user. CASCADE delete keeps DB clean when user is removed. |
| `token` | The secret sent in the email URL. Unique constraint prevents accidental duplicates. |
| `token_type` | Same table handles two flows. Both expire in 15 minutes but have different success behaviors. |
| `expires_at` | Time-based expiry. Old tokens are automatically invalid. No need for cron jobs to clean up. |
| `used` | Prevents reuse. Even if someone intercepts the token, it can only be used once. |

#### Token Lifecycle
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Generated  │────▶│   Sent via  │────▶│   Used by   │
│  (used=F)   │     │   email     │     │  (used=T)   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                    │
       ▼                   ▼                    ▼
  expires_at         User clicks          Marked as used
  (15 min)           the link             in database
```

#### Indexes
| Index | Columns | Purpose |
|-------|---------|---------|
| `ix_verification_tokens_id` | `id` | Primary key lookup (default) |
| `ix_verification_tokens_token` | `token` | Fast lookup when user clicks email link. Token is the lookup key. |

---

## Entity Relationship

```
┌──────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
│    users      │     │  verification_tokens  │     │      domains         │
├──────────────┤     ├──────────────────────┤     ├──────────────────────┤
│ id (PK)      │◄───│ user_id (FK)         │     │ id (PK)              │
│ email (UQ)   │     │ id (PK)              │     │ domain (UQ)          │
│ password_hash│     │ token (UQ)           │     │ admin_email          │
│ is_verified  │     │ token_type           │     │ created_at           │
│ is_active    │     │ expires_at           │     └──────────────────────┘
│ auth_provider│     │ used                 │
│ created_at   │     └──────────────────────┘
│ updated_at   │
└──────────────┘

Relationships:
- One user → Many tokens (1:N)
- One domain → Many users (1:N, via email domain matching)
- Cascade: Deleting a user deletes their tokens
```

---

## Migrations

Alembic manages schema changes. Migration files are in `backend/alembic/versions/`.

## Why Alembic?
Alembic is a database migration tool for SQLAlchemy. It tracks and applies schema changes (add table, add column, modify index, etc.) in a version-controlled way.

Without Alembic — you'd manually write SQL to alter tables. Risky, hard to track, impossible to rollback cleanly.

With Alembic — every schema change is a versioned file. You can apply, rollback, and see history.

### Common Commands
```bash
# Apply all pending migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Create a new migration
alembic revision --autogenerate -m "description"

# Check current migration version
alembic current
```

### Adding a New Column
```bash
# 1. Edit your model in app/models/user.py
# 2. Generate migration
alembic revision --autogenerate -m "add new column"
# 3. Review the generated file in alembic/versions/
# 4. Apply
alembic upgrade head
```

---

## Query Examples

### Find user by email (login)
```python
result = await session.execute(
    select(User).where(User.email == email)
)
user = result.scalar_one_or_none()
```

### Find valid verification token
```python
from datetime import datetime, timezone

result = await session.execute(
    select(VerificationToken).where(
        VerificationToken.token == token,
        VerificationToken.token_type == "email_verification",
        VerificationToken.used == False,
        VerificationToken.expires_at > datetime.now(timezone.utc),
    )
)
token_record = result.scalar_one_or_none()
```

### Mark token as used
```python
token_record.used = True
await session.commit()
```

### Deactivate user (soft delete)
```python
user.is_active = False
await session.commit()
```

---

## Why PostgreSQL?

| Feature | Benefit |
|---------|---------|
| UUID support | Native `gen_random_uuid()` for primary keys |
| JSON/JSONB | Future-proof for flexible data storage |
| ACID compliance | Data integrity for financial records |
| Async support | `asyncpg` driver for non-blocking FastAPI |
| Mature ecosystem | Alembic, SQLAlchemy 2.0 async, pgAdmin |

---

## Backup & Recovery

### Create Backup
```bash
pg_dump -U postgres -d creditpaper > backup.sql
```

### Restore Backup
```bash
psql -U postgres -d creditpaper < backup.sql
```

### Reset Database (Development Only)
```bash
psql -U postgres -d creditpaper -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
alembic upgrade head
```
