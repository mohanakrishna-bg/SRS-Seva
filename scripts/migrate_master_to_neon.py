"""
Direct Migration of Master Tables from Local SQLite to Neon PostgreSQL.
Safely migrates:
1. Roles: Adds 'cashier' and 'trustee', updates 'admin' label to 'Office Admin'.
2. Users: Updates 'nagappa' to 'cashier', sets display names, and initializes passwords to match usernames with must_change_password=True.
3. Settings: Updates 'seva_org_settings' with real contact/UPI details and inserts 'user_passwords_initialized_v1'.
4. PostgreSQL Sequences: Resets sequence counters.
"""

import os
import sqlite3
import psycopg2
import bcrypt
import json
import re
import datetime

def get_database_url():
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise ValueError("DATABASE_URL environment variable is required. Example: export DATABASE_URL='postgresql://...'")
    return re.sub(r'[&?]channel_binding=[^&]*', '', url)

def run_migration():
    print("=" * 60)
    print("🚀 STARTING MASTER TABLES MIGRATION TO NEON POSTGRESQL")
    print("=" * 60)

    # Connect to SQLite
    sq_conn = sqlite3.connect("backend/seva.db")
    sq_conn.row_factory = sqlite3.Row
    sq_cur = sq_conn.cursor()

    # Connect to Neon PostgreSQL
    pg_conn = psycopg2.connect(get_database_url())
    pg_cur = pg_conn.cursor()

    try:
        # ─────────────────────────────────────────────────────────────
        # 1. MIGRATE ROLES
        # ─────────────────────────────────────────────────────────────
        print("\n[1/4] Migrating Roles...")
        sq_cur.execute("SELECT id, name, label, description, permissions, is_builtin FROM roles")
        sqlite_roles = [dict(r) for r in sq_cur.fetchall()]

        for r in sqlite_roles:
            role_name = r["name"]
            label = r["label"]
            desc = r["description"]
            perms = r["permissions"]
            if isinstance(perms, str):
                perms = json.loads(perms)
            is_builtin = bool(r["is_builtin"])

            # Check if role exists in PG
            pg_cur.execute("SELECT id FROM roles WHERE name = %s", (role_name,))
            existing = pg_cur.fetchone()
            if existing:
                pg_cur.execute(
                    """
                    UPDATE roles 
                    SET label = %s, description = %s, permissions = %s, is_builtin = %s, updated_at = NOW()
                    WHERE name = %s
                    """,
                    (label, desc, json.dumps(perms), is_builtin, role_name)
                )
                print(f"  Updated existing role: {role_name} -> {label}")
            else:
                pg_cur.execute(
                    """
                    INSERT INTO roles (name, label, description, permissions, is_builtin, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
                    """,
                    (role_name, label, desc, json.dumps(perms), is_builtin)
                )
                print(f"  Inserted new role: {role_name} ({label})")

        # ─────────────────────────────────────────────────────────────
        # 2. MIGRATE USERS & INITIALIZE PASSWORDS
        # ─────────────────────────────────────────────────────────────
        print("\n[2/4] Migrating Users & Initializing Passwords...")
        # Users mapping from SQLite
        users_metadata = {
            "admin": {
                "role": "admin",
                "display_name": None,
                "modules": None,
            },
            "mohana": {
                "role": "admin",
                "display_name": "Mohana Krishna",
                "modules": None,
            },
            "nagappa": {
                "role": "cashier",
                "display_name": "Nagappa",
                "modules": {"accounting": "read", "donations": "read"},
            },
            "satya": {
                "role": "accountant",
                "display_name": "Satyamurthy",
                "modules": {"seva": "full"},
            }
        }

        for username, meta in users_metadata.items():
            # Generate fresh bcrypt hash
            hashed_pw = bcrypt.hashpw(username.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            role = meta["role"]
            display_name = meta["display_name"]
            modules_json = json.dumps(meta["modules"]) if meta["modules"] else None

            pg_cur.execute("SELECT id FROM users WHERE LOWER(username) = LOWER(%s)", (username,))
            existing = pg_cur.fetchone()

            if existing:
                user_id = existing[0]
                pg_cur.execute(
                    """
                    UPDATE users 
                    SET hashed_password = %s,
                        role = %s,
                        display_name = %s,
                        modules = %s,
                        must_change_password = TRUE,
                        is_active = TRUE,
                        is_deleted = FALSE,
                        updated_at = NOW()
                    WHERE id = %s
                    """,
                    (hashed_pw, role, display_name, modules_json, user_id)
                )
                print(f"  Updated user '{username}' (ID: {user_id}) -> role='{role}', password='{username}', must_change_password=True")
            else:
                pg_cur.execute(
                    """
                    INSERT INTO users (username, hashed_password, role, display_name, modules, must_change_password, is_active, is_deleted, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, TRUE, TRUE, FALSE, NOW(), NOW())
                    """,
                    (username, hashed_pw, role, display_name, modules_json)
                )
                print(f"  Inserted user '{username}' -> role='{role}', password='{username}', must_change_password=True")

        # ─────────────────────────────────────────────────────────────
        # 3. MIGRATE SETTINGS
        # ─────────────────────────────────────────────────────────────
        print("\n[3/4] Migrating Settings...")
        # Update seva_org_settings
        sq_cur.execute("SELECT value FROM settings WHERE key = 'seva_org_settings'")
        sq_org_row = sq_cur.fetchone()
        if sq_org_row:
            org_settings_val = sq_org_row["value"]
            if isinstance(org_settings_val, str):
                org_settings_val = json.loads(org_settings_val)

            pg_cur.execute(
                """
                UPDATE settings 
                SET value = %s, updated_at = NOW() 
                WHERE key = 'seva_org_settings'
                """,
                (json.dumps(org_settings_val),)
            )
            print("  Updated 'seva_org_settings' with genuine phone, WhatsApp, and UPI VPA.")

        # Insert / Update user_passwords_initialized_v1
        now_iso = datetime.datetime.utcnow().isoformat()
        init_flag_val = {
            "initialized_at": now_iso,
            "count": len(users_metadata),
            "triggered_by": "direct_neon_migration"
        }

        pg_cur.execute("SELECT id FROM settings WHERE key = 'user_passwords_initialized_v1'")
        existing_init = pg_cur.fetchone()
        if existing_init:
            pg_cur.execute(
                """
                UPDATE settings 
                SET value = %s, updated_at = NOW() 
                WHERE key = 'user_passwords_initialized_v1'
                """,
                (json.dumps(init_flag_val),)
            )
            print("  Updated 'user_passwords_initialized_v1' flag in settings.")
        else:
            pg_cur.execute(
                """
                INSERT INTO settings (key, value, updated_at)
                VALUES ('user_passwords_initialized_v1', %s, NOW())
                """,
                (json.dumps(init_flag_val),)
            )
            print("  Inserted 'user_passwords_initialized_v1' flag in settings.")

        # ─────────────────────────────────────────────────────────────
        # 4. RESET AUTO-INCREMENT SEQUENCES
        # ─────────────────────────────────────────────────────────────
        print("\n[4/4] Resetting Sequences...")
        sequences = [
            ("users_id_seq", "users", "id"),
            ("roles_id_seq", "roles", "id"),
            ("settings_id_seq", "settings", "id"),
        ]
        for seq_name, tbl_name, col_name in sequences:
            try:
                pg_cur.execute(f'SELECT COALESCE(MAX("{col_name}"), 0) + 1 FROM "{tbl_name}";')
                next_val = pg_cur.fetchone()[0]
                pg_cur.execute(f"SELECT setval('{seq_name}', %s, false);", (next_val,))
                print(f"  Reset sequence '{seq_name}' to {next_val}")
            except Exception as ex:
                print(f"  Notice on sequence '{seq_name}': {ex}")

        # Commit all changes
        pg_conn.commit()
        print("\n" + "=" * 60)
        print("✅ MIGRATION COMPLETED AND COMMITTED SUCCESSFULLY!")
        print("=" * 60)

    except Exception as e:
        pg_conn.rollback()
        print(f"\n❌ Migration failed, transaction rolled back: {e}")
        raise
    finally:
        pg_conn.close()
        sq_conn.close()

if __name__ == "__main__":
    run_migration()
