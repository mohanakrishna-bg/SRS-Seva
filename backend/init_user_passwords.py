"""
Initialize user passwords to match their usernames and enforce immediate password change.
Works seamlessly for both local SQLite and production PostgreSQL (Neon).

Usage:
    PYTHONPATH=backend python3 backend/init_user_passwords.py [--force]
"""
import sys
import argparse
import datetime
from app import database
from app.models import models
from app.core import auth

def init_user_passwords(force: bool = False):
    db = database.SessionLocal()
    try:
        users = db.query(models.User).filter(
            (models.User.is_deleted == False) | (models.User.is_deleted == None)
        ).all()
        print(f"Found {len(users)} active users.")
        updated_count = 0
        for user in users:
            user.hashed_password = auth.get_password_hash(user.username)
            user.must_change_password = True
            updated_count += 1
            print(f"  Initialized password for user '{user.username}' (ID: {user.id}, Role: {user.role}) -> password='{user.username}', must_change_password=True")

        # Record in Settings table so startup migration knows it was completed
        setting = db.query(models.Settings).filter(models.Settings.key == "user_passwords_initialized_v1").first()
        now = datetime.datetime.utcnow().isoformat()
        if not setting:
            setting = models.Settings(
                key="user_passwords_initialized_v1",
                value={"initialized_at": now, "count": updated_count, "triggered_by": "cli_script"}
            )
            db.add(setting)
        else:
            setting.value = {"initialized_at": now, "count": updated_count, "triggered_by": "cli_script"}

        db.commit()
        print(f"\n[SUCCESS] Initialized passwords for {updated_count} users to match their usernames with must_change_password=True.")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to initialize user passwords: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Initialize user passwords to match usernames.")
    parser.add_argument("--force", action="store_true", help="Force re-initialization even if previously initialized.")
    args = parser.parse_args()
    init_user_passwords(force=args.force)
