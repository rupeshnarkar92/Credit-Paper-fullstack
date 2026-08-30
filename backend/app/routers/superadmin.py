from fastapi import APIRouter, Depends, HTTPException, Request, Query
from fastapi.responses import JSONResponse
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.database import get_db
from app.models.user import User
from app.config import get_settings
from app.security.password import verify_password
from app.security.jwt import create_access_token, decode_access_token
from app.security.encryption import encrypt, decrypt

router = APIRouter(prefix="/api/superadmin", tags=["superadmin"])
limiter = Limiter(key_func=get_remote_address)
settings = get_settings()

USE_ENCRYPTION = settings.USE_ENCRYPTION


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


async def get_current_super_admin(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    token = request.cookies.get("access_token")

    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated.")

    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found.")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated.")

    if not user.is_super_admin:
        raise HTTPException(status_code=403, detail="Access denied. Super admin privileges required.")

    return user


@router.post("/login")
@limiter.limit("5/minute")
async def superadmin_login(request: Request, db: AsyncSession = Depends(get_db)):
    body = await get_body(request)
    data = maybe_decrypt(body)
    email = data.get("email", "")
    password = data.get("password", "")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required.")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email.")

    if not user.is_super_admin:
        raise HTTPException(status_code=403, detail="Access denied. This account is not a super admin.")

    if user.auth_provider == "google" or not user.password_hash:
        raise HTTPException(status_code=400, detail="This account uses Google Sign-In.")

    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect password.")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Your account has been deactivated.")

    if not user.is_email_verified:
        raise HTTPException(status_code=403, detail="Please verify your email before signing in.")

    access_token = create_access_token(user.id)

    user.last_login = datetime.now(timezone.utc)
    await db.commit()

    user_data = {
        "id": user.id,
        "email": user.email,
        "is_super_admin": user.is_super_admin,
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
async def superadmin_logout():
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie(key="access_token", path="/")
    return response


@router.get("/me")
async def superadmin_me(user: User = Depends(get_current_super_admin)):
    return encrypt_response({
        "id": user.id,
        "email": user.email,
        "is_super_admin": user.is_super_admin,
        "created_at": user.created_at.isoformat(),
    })


@router.get("/users")
async def list_users(
    request: Request,
    db: AsyncSession = Depends(get_db),
    search: str = Query("", description="Search by email"),
    role: str = Query("", description="Filter by role"),
    status: str = Query("", description="Filter by status: active or inactive"),
    page: int = Query(1, ge=1),
    limit: int = Query(8, ge=1, le=50),
    _user: User = Depends(get_current_super_admin),
):
    query = select(User)
    count_query = select(func.count(User.id))

    if search:
        like = f"%{search}%"
        query = query.where(User.email.ilike(like))
        count_query = count_query.where(User.email.ilike(like))

    if role:
        query = query.where(User.role == role)
        count_query = count_query.where(User.role == role)

    if status == "active":
        query = query.where(User.is_active == True)
        count_query = count_query.where(User.is_active == True)
    elif status == "inactive":
        query = query.where(User.is_active == False)
        count_query = count_query.where(User.is_active == False)

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    offset = (page - 1) * limit
    query = query.order_by(User.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    users = result.scalars().all()

    items = []
    for u in users:
        items.append({
            "id": u.id,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
            "is_super_admin": u.is_super_admin,
            "auth_provider": u.auth_provider,
            "last_login": u.last_login.isoformat() if u.last_login else None,
            "created_at": u.created_at.isoformat(),
        })

    return encrypt_response({
        "users": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
    })
