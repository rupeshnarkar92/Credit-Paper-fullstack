import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal, Base, engine
from app.models.user import User
from app.security.password import hash_password


async def seed_super_admin():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == "superadmin@creditpaper.com"))
        existing = result.scalar_one_or_none()

        if existing:
            existing.is_super_admin = True
            existing.is_email_verified = True
            if not existing.password_hash:
                existing.password_hash = hash_password("Admin@123")
            await db.commit()
            print(f"Updated {existing.email} to super admin.")
            return

        user = User(
            email="superadmin@creditpaper.com",
            password_hash=hash_password("Admin@123"),
            auth_provider="email",
            is_email_verified=True,
            is_super_admin=True,
        )
        db.add(user)
        await db.commit()
        print("Super admin created: superadmin@creditpaper.com / Admin@123")


if __name__ == "__main__":
    asyncio.run(seed_super_admin())
