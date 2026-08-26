"""
User Management API — Admin-only endpoints for CRUD on users and roles.
Includes audit trail for all permission/role/status changes.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import datetime
from app import database
from app.models import models
from app.schemas import schemas
from app.core.auth import (
    get_password_hash,
    require_role,
    get_user_accessible_modules,
    get_permission_matrix,
    get_all_db_roles,
    ALL_ROLES,
    ROLE_ADMIN,
    ROLE_META,
    MODULE_META,
    PERMISSION_LEVELS,
)

router = APIRouter(prefix="/api/users", tags=["users"])


# ─── Audit Helper ───

def _log_audit(db: Session, admin: models.User, target_username: str, target_user_id: int, action: str, details: dict = None):
    """Record a user administration action in the audit trail."""
    entry = models.UserAuditLog(
        timestamp=datetime.datetime.utcnow(),
        admin_username=admin.username,
        target_username=target_username,
        target_user_id=target_user_id,
        action=action,
        details=details,
    )
    db.add(entry)
    # Don't commit here — caller manages the transaction


# ─── Permission Matrix Endpoint ───

@router.get("/permissions/matrix")
async def get_permission_matrix_endpoint(
    db: Session = Depends(database.get_db),
    _admin: models.User = Depends(require_role(ROLE_ADMIN)),
):
    """Get the full permission matrix with role and module metadata for the UI."""
    # Build role metadata from DB
    db_roles = db.query(models.Role).order_by(models.Role.id).all()
    if db_roles:
        role_meta = {
            r.name: {"label": r.label, "description": r.description or ""}
            for r in db_roles
        }
    else:
        role_meta = ROLE_META

    return {
        "roles": role_meta,
        "modules": MODULE_META,
        "defaults": get_permission_matrix(db),
        "permission_levels": PERMISSION_LEVELS,
    }


# ─── User Audit Log Endpoint ───

@router.get("/audit-log")
async def get_user_audit_log(
    target_user_id: int = None,
    limit: int = 50,
    db: Session = Depends(database.get_db),
    _admin: models.User = Depends(require_role(ROLE_ADMIN)),
):
    """Get audit trail of user management changes."""
    query = db.query(models.UserAuditLog)
    if target_user_id:
        query = query.filter(models.UserAuditLog.target_user_id == target_user_id)
    entries = query.order_by(models.UserAuditLog.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": e.id,
            "timestamp": e.timestamp.isoformat() if e.timestamp else None,
            "admin_username": e.admin_username,
            "target_username": e.target_username,
            "target_user_id": e.target_user_id,
            "action": e.action,
            "details": e.details,
        }
        for e in entries
    ]


# ─── CRUD Endpoints ───

@router.get("/roles/available", response_model=List[str])
async def get_available_roles(
    db: Session = Depends(database.get_db),
    _admin: models.User = Depends(require_role(ROLE_ADMIN)),
):
    """Get list of valid roles for user creation/assignment."""
    return get_all_db_roles(db)


@router.get("", response_model=List[schemas.User])
@router.get("/", response_model=List[schemas.User])
async def list_users(
    role: str = None,
    db: Session = Depends(database.get_db),
    _admin: models.User = Depends(require_role(ROLE_ADMIN)),
):
    """List all active (non-deleted) users. Optionally filter by role."""
    query = db.query(models.User).filter(models.User.is_deleted == False)
    if role:
        query = query.filter(models.User.role == role)
    return query.order_by(models.User.id).all()


@router.get("/{user_id}", response_model=schemas.UserWithModules)
async def get_user(
    user_id: int,
    db: Session = Depends(database.get_db),
    _admin: models.User = Depends(require_role(ROLE_ADMIN)),
):
    """Get a user by ID with their accessible modules."""
    user = db.query(models.User).filter(models.User.id == user_id, models.User.is_deleted == False).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user_dict = schemas.User.model_validate(user).model_dump()
    user_dict["accessible_modules"] = get_user_accessible_modules(user, db)
    return user_dict


@router.post("", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: schemas.UserCreate,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(require_role(ROLE_ADMIN)),
):
    """Create a new user with optional module permission overrides."""
    from sqlalchemy import func, or_
    valid_roles = get_all_db_roles(db)
    role_lower = user_data.role.strip().lower()
    role_map = {r.lower(): r for r in valid_roles}
    if role_lower in role_map:
        user_data.role = role_map[role_lower]
    elif user_data.role not in valid_roles:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role '{user_data.role}'. Must be one of: {', '.join(valid_roles)}",
        )

    username_clean = user_data.username.strip()
    if not username_clean:
        raise HTTPException(status_code=400, detail="Username cannot be empty")

    # Check duplicate username (case-insensitive)
    existing = db.query(models.User).filter(
        func.lower(models.User.username) == username_clean.lower(),
        or_(models.User.is_deleted == False, models.User.is_deleted == None)
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Username '{username_clean}' already exists")

    try:
        user = models.User(
            username=username_clean,
            hashed_password=get_password_hash(user_data.password),
            role=user_data.role,
            display_name=user_data.display_name.strip() if user_data.display_name else None,
            modules=user_data.modules,
            must_change_password=True,
        )
        db.add(user)
        db.flush()  # Get the user ID before audit log

        # Audit trail
        _log_audit(db, admin, user.username, user.id, "create", {
            "role": user_data.role,
            "modules": user_data.modules,
        })

        db.commit()
        db.refresh(user)
        return user
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to create user: {str(e)}")


@router.put("/{user_id}", response_model=schemas.User)
async def update_user(
    user_id: int,
    user_data: schemas.UserUpdate,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(require_role(ROLE_ADMIN)),
):
    """Update a user's profile, role, or permissions."""
    from sqlalchemy import func, or_
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    changes = {}  # Track what changed for audit

    if user_data.username is not None:
        username_clean = user_data.username.strip()
        if not username_clean:
            raise HTTPException(status_code=400, detail="Username cannot be empty")
        # Check for duplicate
        existing = db.query(models.User).filter(
            func.lower(models.User.username) == username_clean.lower(),
            models.User.id != user_id,
            or_(models.User.is_deleted == False, models.User.is_deleted == None)
        ).first()
        if existing:
            raise HTTPException(status_code=409, detail=f"Username '{username_clean}' already taken")
        if user.username != username_clean:
            changes["username"] = {"old": user.username, "new": username_clean}
        user.username = username_clean

    if user_data.password is not None:
        user.hashed_password = get_password_hash(user_data.password)
        changes["password"] = {"changed": True}

    if user_data.role is not None:
        valid_roles = get_all_db_roles(db)
        role_lower = user_data.role.strip().lower()
        role_map = {r.lower(): r for r in valid_roles}
        if role_lower in role_map:
            user_data.role = role_map[role_lower]
        elif user_data.role not in valid_roles:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid role '{user_data.role}'. Must be one of: {', '.join(valid_roles)}",
            )
        if user.role != user_data.role:
            changes["role"] = {"old": user.role, "new": user_data.role}
        user.role = user_data.role

    if user_data.display_name is not None:
        if user.display_name != user_data.display_name:
            changes["display_name"] = {"old": user.display_name, "new": user_data.display_name}
        user.display_name = user_data.display_name

    if user_data.is_active is not None:
        if user.is_active != user_data.is_active:
            changes["is_active"] = {"old": user.is_active, "new": user_data.is_active}
        user.is_active = user_data.is_active

    if user_data.modules is not None:
        old_modules = user.modules
        if old_modules != user_data.modules:
            changes["modules"] = {"old": old_modules, "new": user_data.modules}
        user.modules = user_data.modules

    # Determine audit action from changes
    if changes:
        if "role" in changes and "modules" in changes:
            action = "update_role_and_permissions"
        elif "role" in changes:
            action = "update_role"
        elif "modules" in changes:
            action = "update_permissions"
        elif "is_active" in changes:
            action = "activate" if user_data.is_active else "deactivate"
        else:
            action = "update_profile"

        _log_audit(db, admin, user.username, user.id, action, changes)

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(require_role(ROLE_ADMIN)),
):
    """Soft-delete a user. Cannot delete yourself or root admin (ID 0). Preserves audit trail."""
    if admin.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    if user_id == 0:
        raise HTTPException(status_code=400, detail="Cannot delete the root admin account")

    user = db.query(models.User).filter(models.User.id == user_id, models.User.is_deleted == False).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Soft delete
    user.is_deleted = True
    user.is_active = False

    # Audit trail
    _log_audit(db, admin, user.username, user.id, "delete", {
        "role": user.role,
        "modules": user.modules,
        "soft_deleted": True,
    })

    db.commit()


@router.post("/{user_id}/reset-password", response_model=schemas.User)
async def reset_password(
    user_id: int,
    new_password: str,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(require_role(ROLE_ADMIN)),
):
    """Reset a user's password (admin-only)."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = get_password_hash(new_password)
    user.must_change_password = True

    _log_audit(db, admin, user.username, user.id, "reset_password", None)

    db.commit()
    db.refresh(user)
    return user
