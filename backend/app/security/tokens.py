import secrets
from datetime import datetime, timedelta, timezone
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import Base


class VerificationToken(Base):
    __tablename__ = "verification_tokens"

    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    token = Column(String(64), unique=True, nullable=False, index=True)
    token_type = Column(String(20), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, default=False)


async def generate_verification_token(db: AsyncSession, user_id: str) -> str:
    token = secrets.token_urlsafe(48)
    db_token = VerificationToken(
        id=str(secrets.token_urlsafe(16)),
        user_id=user_id,
        token=token,
        token_type="email_verification",
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
    )
    db.add(db_token)
    await db.commit()
    return token


async def generate_password_reset_token(db: AsyncSession, user_id: str) -> str:
    token = secrets.token_urlsafe(48)
    db_token = VerificationToken(
        id=str(secrets.token_urlsafe(16)),
        user_id=user_id,
        token=token,
        token_type="password_reset",
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
    )
    db.add(db_token)
    await db.commit()
    return token


async def verify_token(db: AsyncSession, token: str, token_type: str) -> str | None:
    result = await db.execute(
        select(VerificationToken).where(
            VerificationToken.token == token,
            VerificationToken.token_type == token_type,
            VerificationToken.used == False,
            VerificationToken.expires_at > datetime.now(timezone.utc),
        )
    )
    db_token = result.scalar_one_or_none()
    if not db_token:
        return None
    db_token.used = True
    await db.commit()
    return db_token.user_id
