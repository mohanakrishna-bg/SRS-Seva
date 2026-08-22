"""
Seva Modern Intranet — FastAPI Application Entry Point.

This is the thin orchestrator that:
1. Creates the FastAPI app
2. Reads MODULE_FILTER to conditionally mount module routers
3. Adds middleware (CORS)
4. Mounts static files
5. Provides health check and auth endpoints

All domain logic lives in:
- app/modules/seva/router.py     — Devotees, Sevas, Registrations, Calendar, Stats
- app/api/accounting.py          — Journal, Bank, Reports, Close Day
- app/api/inventory.py           — Assets, Consumables, Donations, Audit
- app/api/users.py               — User management (admin)
- app/api/settings.py            — Organization settings
- app/api/test_data.py           — Simulation and cleanup
- app/api/image_sync.py          — Image sync utilities
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os

from app.models import models
from app.schemas import schemas
from app import database
from app.core import auth
from app.core.config import get_settings

settings = get_settings()

# ─── Create tables ───
models.Base.metadata.create_all(bind=database.engine)

# ─── Sync Sequences (PostgreSQL only) ───
def sync_postgres_sequences():
    if not settings.is_postgres:
        return
    from sqlalchemy import text
    try:
        with database.engine.begin() as conn:
            query = """
            SELECT 
                s.sequence_name,
                t.table_name,
                c.column_name
            FROM information_schema.sequences s
            LEFT JOIN information_schema.columns c 
                ON c.column_default LIKE '%' || s.sequence_name || '%'
            LEFT JOIN information_schema.tables t 
                ON t.table_name = c.table_name
            WHERE s.sequence_schema = 'public';
            """
            rows = conn.execute(text(query)).fetchall()
            for seq_name, tbl_name, col_name in rows:
                if tbl_name and col_name:
                    try:
                        q = f'SELECT setval(\'"{seq_name}"\'::regclass, COALESCE((SELECT MAX("{col_name}") FROM "{tbl_name}"), 0) + 1, false);'
                        conn.execute(text(q))
                    except Exception as e:
                        print(f"Failed to reset sequence {seq_name} for {tbl_name}.{col_name}: {e}")
    except Exception as err:
        print(f"Sequence sync error: {err}")

sync_postgres_sequences()

# ─── FastAPI App ───
app = FastAPI(title="Seva Modern Intranet")

# ─── CORS ───
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Static Files ───
UPLOAD_DIR = settings.UPLOAD_DIR
PHOTO_DIR = os.path.join(UPLOAD_DIR, "photos")
for d in [UPLOAD_DIR, PHOTO_DIR]:
    os.makedirs(d, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# ═══════════════════════════════════════════════════════════
# MODULE ROUTER MOUNTING (with optional MODULE_FILTER)
# ═══════════════════════════════════════════════════════════

def _should_mount(module_name: str) -> bool:
    """Check if a module should be mounted based on MODULE_FILTER."""
    active = settings.active_modules
    return len(active) == 0 or module_name in active  # Empty = all modules


# Always mount: auth and health (core infrastructure)
# Conditionally mount: domain modules

if _should_mount("seva"):
    from app.modules.seva.router import router as seva_router
    app.include_router(seva_router)

if _should_mount("accounting"):
    from app.api.accounting import router as accounting_router
    app.include_router(accounting_router)

if _should_mount("inventory"):
    from app.api.inventory import router as inventory_router
    app.include_router(inventory_router)

if _should_mount("settings"):
    from app.api.settings import router as settings_router
    app.include_router(settings_router, prefix="/api/settings", tags=["settings"])

if _should_mount("users"):
    from app.api.users import router as users_router
    app.include_router(users_router)

# Always mount: test data and image sync (dev tools)
from app.api.test_data import router as test_data_router
app.include_router(test_data_router)

from app.api.image_sync import router as image_sync_router
app.include_router(image_sync_router)


# ═══════════════════════════════════════════════════════════
# CORE ENDPOINTS (always available)
# ═══════════════════════════════════════════════════════════

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "modules": settings.active_modules or "all",
        "database": "postgresql" if settings.is_postgres else "sqlite",
    }


# ─── Auth ───

@app.get("/api/sync-sequences")
def trigger_sync_sequences():
    sync_postgres_sequences()
    return {"status": "sequences synchronized successfully"}

@app.get("/api/fix-admin")
def fix_admin(db: Session = Depends(database.get_db)):
    from app.core import auth
    sync_postgres_sequences()
    admin = db.query(models.User).filter(models.User.username == "admin").first()
    if not admin:
        admin = models.User(
            username="admin",
            hashed_password=auth.get_password_hash("admin"),
            role="admin",
            is_active=True,
            modules=None,
            must_change_password=True
        )
        db.add(admin)
        db.commit()
        return {"status": "created admin"}
    else:
        # Force reset the password to 'admin'
        admin.hashed_password = auth.get_password_hash("admin")
        admin.must_change_password = True
        db.commit()
        return {"status": "admin password forced reset to 'admin'", "is_active": admin.is_active}

@app.post("/api/token")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(database.get_db),
):
    from sqlalchemy import func
    username_input = form_data.username.strip()
    user = db.query(models.User).filter(func.lower(models.User.username) == username_input.lower()).first()
    
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )
    access_token = auth.create_access_token(data={
        "sub": user.username,
        "role": user.role,
        "modules": user.modules,
    })
    user_data = schemas.UserWithModules.model_validate(user).model_dump()
    user_data["accessible_modules"] = auth.get_user_accessible_modules(user)
    user_data["must_change_password"] = user.must_change_password
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_data,
    }


@app.get("/api/me")
async def get_current_user_profile(
    user: models.User = Depends(auth.get_current_user),
):
    """Get current authenticated user's profile and accessible modules."""
    user_data = schemas.UserWithModules.model_validate(user).model_dump()
    user_data["accessible_modules"] = auth.get_user_accessible_modules(user)
    user_data["must_change_password"] = user.must_change_password
    return user_data


@app.post("/api/change-password")
async def change_password(
    req: schemas.ChangePasswordRequest,
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    """Change the current user's password. Used for forced password change on first login."""
    if not auth.verify_password(req.current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    if len(req.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters",
        )
    if req.current_password == req.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password",
        )
    user.hashed_password = auth.get_password_hash(req.new_password)
    user.must_change_password = False
    db.commit()
    db.refresh(user)
    user_data = schemas.UserWithModules.model_validate(user).model_dump()
    user_data["accessible_modules"] = auth.get_user_accessible_modules(user)
    user_data["must_change_password"] = user.must_change_password
    return user_data


# ─── Startup ───

@app.on_event("startup")
def startup_event():
    db = next(database.get_db())
    if not db.query(models.User).filter(models.User.username == "admin").first():
        admin_user = models.User(
            username="admin",
            hashed_password=auth.get_password_hash("admin123"),
            role="admin",
            must_change_password=True,
        )
        db.add(admin_user)
        db.commit()
