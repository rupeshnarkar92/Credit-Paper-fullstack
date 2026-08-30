from fastapi import Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.security.jwt import decode_access_token


async def get_current_user(
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

    return user
