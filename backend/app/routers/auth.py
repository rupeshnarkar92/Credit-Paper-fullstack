from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import RedirectResponse, JSONResponse
from urllib.parse import urlencode
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from slowapi import Limiter
from slowapi.util import get_remote_address
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.models.domain import Domain
from app.dependencies import get_current_user
from app.config import get_settings
from app.security.tokens import generate_verification_token, generate_password_reset_token, verify_token, VerificationToken
from app.security.password import hash_password, verify_password
from app.security.jwt import create_access_token
from app.security.encryption import encrypt, decrypt
from app.services.email import send_verification_email, send_password_reset_email
from app.services.google import exchange_code, get_user_info

router = APIRouter(prefix="/api/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)
settings = get_settings()

USE_ENCRYPTION = settings.USE_ENCRYPTION

FREE_EMAIL_PROVIDERS = {
    "gmail.com", "googlemail.com",
    "yahoo.com", "yahoo.co.in", "yahoo.co.uk",
    "outlook.com", "hotmail.com", "live.com", "live.co.uk", "msn.com",
    "aol.com",
    "icloud.com", "me.com", "mac.com",
    "protonmail.com", "proton.me",
    "tutanota.com", "tutanota.de",
    "zoho.com", "zohomail.com",
    "yandex.com", "yandex.ru",
    "mail.com", "email.com",
    "gmx.com", "gmx.de",
    "fastmail.com", "fastmail.fm",
    "hey.com",
    "qq.com", "163.com", "126.com",
}


def get_domain_from_email(email: str) -> str:
    return email.split("@")[-1].lower().strip()


def is_free_provider(domain: str) -> bool:
    return domain in FREE_EMAIL_PROVIDERS


async def get_body(request: Request) -> dict:
    return await request.json()


def maybe_decrypt(body: dict) -> dict:
    if USE_ENCRYPTION and "data" in body:
        return decrypt(body["data"])
    return body


def encrypt_response(data: dict) -> dict:
    if USE_ENCRYPTION:
        return {"data": encrypt(data)}
    return data


class UserResponse(BaseModel):
    id: int
    email: str
    is_email_verified: bool
    is_active: bool
    auth_provider: str
    created_at: str


class MessageResponse(BaseModel):
    message: str


@router.post("/register", status_code=201)
@limiter.limit("5/minute")
async def register(request: Request, db: AsyncSession = Depends(get_db)):
    body = await get_body(request)
    data = maybe_decrypt(body)
    email = data.get("email", "")
    password = data.get("password", "")

    result = await db.execute(select(User).where(User.email == email))
    existing = result.scalar_one_or_none()
    if existing:
        if existing.auth_provider == "google":
            raise HTTPException(status_code=409, detail="An account with this email already exists using Google Sign-In. Please login with Google instead.")
        raise HTTPException(status_code=409, detail="An account with this email already exists. Please sign in instead.")

    domain = get_domain_from_email(email)
    if not is_free_provider(domain):
        domain_result = await db.execute(select(Domain).where(Domain.domain == domain))
        existing_domain = domain_result.scalar_one_or_none()
        if existing_domain:
            raise HTTPException(
                status_code=403,
                detail=f"This email domain is managed by an organization. Please contact your administrator at {existing_domain.admin_email} to get an invite.",
            )
        new_domain = Domain(domain=domain, admin_email=email)
        db.add(new_domain)

    user = User(
        email=email,
        password_hash=hash_password(password),
        auth_provider="email",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = await generate_verification_token(db, user.id)
    send_verification_email(user.email, token)

    return encrypt_response({
        "message": "Account created. Please verify your email.",
        "user_id": user.id,
    })


@router.get("/verify-email")
async def verify_email(token: str = Query(...), db: AsyncSession = Depends(get_db)):
    user_id = await verify_token(db, token, "email_verification")
    if not user_id:
        result = await db.execute(
            select(VerificationToken).where(
                VerificationToken.token == token,
                VerificationToken.token_type == "email_verification",
            )
        )
        used_token = result.scalar_one_or_none()
        if used_token:
            user_result = await db.execute(select(User).where(User.id == used_token.user_id))
            user = user_result.scalar_one_or_none()
            if user and user.is_email_verified:
                return {"message": "Email already verified."}

        if used_token:
            user_result = await db.execute(select(User).where(User.id == used_token.user_id))
            user = user_result.scalar_one_or_none()
            if user and not user.is_email_verified:
                new_token = await generate_verification_token(db, user.id)
                send_verification_email(user.email, new_token)
                return {"message": f"A new verification link has been sent to {user.email}.", "email": user.email}

        raise HTTPException(status_code=400, detail="Invalid or expired verification token.")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="User not found.")

    user.is_email_verified = True
    await db.commit()

    return {"message": "Email verified successfully."}


@router.post("/resend-verification")
async def resend_verification(request: Request, db: AsyncSession = Depends(get_db)):
    body = await get_body(request)
    data = maybe_decrypt(body)
    email = data.get("email", "")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user or user.is_email_verified:
        return {"message": "If an account exists, a verification email has been sent."}

    token = await generate_verification_token(db, user.id)
    send_verification_email(user.email, token)

    return {"message": "If an account exists, a verification email has been sent."}


@router.post("/login")
@limiter.limit("10/minute")
async def login(request: Request, db: AsyncSession = Depends(get_db)):
    body = await get_body(request)
    data = maybe_decrypt(body)
    email = data.get("email", "")
    password = data.get("password", "")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email. Please sign up first.")

    if user.auth_provider == "google" or not user.password_hash:
        raise HTTPException(status_code=400, detail="This account uses Google Sign-In. Please login with Google instead.")

    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect password. Please try again or reset your password.")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Your account has been deactivated. Please contact support.")

    if not user.is_email_verified:
        raise HTTPException(status_code=403, detail="Please verify your email before signing in. Check your inbox for the verification link.")

    access_token = create_access_token(user.id)

    user_data = {
        "id": user.id,
        "email": user.email,
        "is_email_verified": user.is_email_verified,
        "is_active": user.is_active,
        "auth_provider": user.auth_provider,
        "created_at": user.created_at.isoformat(),
    }
    response_data = encrypt_response({"user": user_data})

    response = JSONResponse(content=response_data)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=1800,
        path="/",
    )
    return response


@router.post("/logout")
async def logout():
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie(key="access_token", path="/")
    return response


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return encrypt_response({
        "id": current_user.id,
        "email": current_user.email,
        "is_email_verified": current_user.is_email_verified,
        "is_active": current_user.is_active,
        "auth_provider": current_user.auth_provider,
        "created_at": current_user.created_at.isoformat(),
    })


@router.post("/forgot-password")
@limiter.limit("3/minute")
async def forgot_password(request: Request, db: AsyncSession = Depends(get_db)):
    body = await get_body(request)
    data = maybe_decrypt(body)
    email = data.get("email", "")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email. Please sign up first.")

    if user.auth_provider == "google":
        raise HTTPException(status_code=400, detail="This account uses Google Sign-In. Please login with Google instead.")

    token = await generate_password_reset_token(db, user.id)
    send_password_reset_email(user.email, token)

    return encrypt_response({
        "message": "A password reset link has been sent to your email. Please check your inbox and spam folder."
    })


@router.post("/reset-password")
@limiter.limit("5/minute")
async def reset_password(request: Request, db: AsyncSession = Depends(get_db)):
    body = await get_body(request)
    data = maybe_decrypt(body)
    token = data.get("token", "")
    new_password = data.get("new_password", "")

    user_id = await verify_token(db, token, "password_reset")
    if not user_id:
        raise HTTPException(status_code=400, detail="This reset link has expired or already been used. Please request a new one.")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="User not found.")

    user.password_hash = hash_password(new_password)
    await db.commit()

    return encrypt_response({"message": "Password reset successfully."})


@router.get("/google")
async def google_login():
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
    }
    google_auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return RedirectResponse(url=google_auth_url)


@router.get("/google/callback")
async def google_callback(code: str = Query(...), db: AsyncSession = Depends(get_db)):
    try:
        token_data = await exchange_code(code)
        user_info = await get_user_info(token_data["access_token"])
    except Exception:
        raise HTTPException(status_code=400, detail="Google sign-in failed. Please try again or use email/password login.")

    email = user_info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Could not retrieve email from Google. Please try again.")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user:
        if user.auth_provider != "google":
            raise HTTPException(status_code=409, detail="An account with this email already exists using email/password. Please login with your email and password instead.")
    else:
        domain = get_domain_from_email(email)
        if not is_free_provider(domain):
            domain_result = await db.execute(select(Domain).where(Domain.domain == domain))
            existing_domain = domain_result.scalar_one_or_none()
            if existing_domain:
                raise HTTPException(
                    status_code=403,
                    detail=f"This email domain is managed by an organization. Please contact your administrator at {existing_domain.admin_email} to get an invite.",
                )
            new_domain = Domain(domain=domain, admin_email=email)
            db.add(new_domain)

        user = User(
            email=email,
            password_hash=None,
            auth_provider="google",
            is_email_verified=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    access_token = create_access_token(user.id)

    response = RedirectResponse(url=f"{settings.FRONTEND_URL}/dashboard")
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=1800,
        path="/",
    )
    return response


@router.get("/admin/users")
async def admin_list_users(secret: str = Query(...), db: AsyncSession = Depends(get_db)):
    if secret != "admin_secret_2024":
        raise HTTPException(status_code=403, detail="Invalid secret")
    result = await db.execute(select(User))
    users = result.scalars().all()
    return [{"id": str(u.id), "email": u.email, "verified": u.is_email_verified, "provider": u.auth_provider} for u in users]


@router.delete("/admin/users")
async def admin_delete_users(secret: str = Query(...), db: AsyncSession = Depends(get_db)):
    if secret != "admin_secret_2024":
        raise HTTPException(status_code=403, detail="Invalid secret")
    from app.security.tokens import VerificationToken
    from app.models.domain import Domain
    await db.execute(Domain.__table__.delete())
    await db.execute(VerificationToken.__table__.delete())
    result = await db.execute(select(User))
    users = result.scalars().all()
    count = len(users)
    for u in users:
        await db.delete(u)
    await db.commit()
    return {"deleted": count}
