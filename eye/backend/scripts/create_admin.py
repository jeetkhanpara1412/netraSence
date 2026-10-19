"""Create or promote the first local administrator without storing its password."""

import getpass
import sys
from pathlib import Path

from pydantic import EmailStr, TypeAdapter, ValidationError

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.security import get_password_hash
from app.db.models import User
from app.db.session import SessionLocal


def main() -> int:
    db = SessionLocal()
    try:
        if db.query(User).filter(User.role == "ADMIN").first():
            print("An administrator already exists; no account was created.")
            return 1

        email = input("Administrator email: ").strip().lower()
        try:
            TypeAdapter(EmailStr).validate_python(email)
        except ValidationError:
            print("Enter a valid email address.")
            return 1

        full_name = input("Administrator name: ").strip()
        if len(full_name) < 2 or len(full_name) > 255:
            print("Name must contain between 2 and 255 characters.")
            return 1

        password = getpass.getpass("Administrator password (12-72 UTF-8 bytes): ")
        confirmation = getpass.getpass("Confirm password: ")
        if password != confirmation:
            print("Passwords do not match.")
            return 1
        if not 12 <= len(password.encode("utf-8")) <= 72:
            print("Password must contain between 12 and 72 UTF-8 bytes.")
            return 1

        user = db.query(User).filter(User.email == email).first()
        if user is None:
            user = User(
                email=email,
                full_name=full_name,
                hashed_password=get_password_hash(password),
                role="ADMIN",
                is_active=True,
                email_verified=True,
            )
            db.add(user)
            action = "created"
        else:
            user.full_name = full_name
            user.hashed_password = get_password_hash(password)
            user.role = "ADMIN"
            user.is_active = True
            user.email_verified = True
            user.failed_login_attempts = 0
            user.locked_until = None
            action = "promoted"

        db.commit()
        print(f"Administrator account {action}. Sign in through the application.")
        return 0
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
