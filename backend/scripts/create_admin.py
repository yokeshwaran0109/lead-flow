"""Create or update an admin account. Run from backend/: python scripts/create_admin.py"""
import asyncio
import getpass
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select

from app.core.database import async_session_maker
from app.core.security import hash_password
from app.models.admin import Admin


async def main():
    email = input("Admin email: ").strip()
    name = input("Admin name: ").strip()
    password = getpass.getpass("Admin password: ")

    async with async_session_maker() as db:
        existing = await db.scalar(select(Admin).where(Admin.email == email))
        if existing:
            existing.password_hash = hash_password(password)
            existing.name = name
            await db.commit()
            print(f"Updated existing admin {email}")
        else:
            db.add(Admin(email=email, name=name, password_hash=hash_password(password)))
            await db.commit()
            print(f"Created admin {email}")


if __name__ == "__main__":
    asyncio.run(main())
