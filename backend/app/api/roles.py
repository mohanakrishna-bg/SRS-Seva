"""
Role Management API — Admin-only endpoints for CRUD on roles and permissions.
Roles define per-module permission defaults that users inherit.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import re
import datetime
from app import database
from app.models import models
from app.schemas import schemas
from app.core.auth import (
    require_role,
    ROLE_ADMIN,
    MODULE_META,
    PERMISSION_LEVELS,
)

router = APIRouter(prefix="/api/roles", tags=["roles"])

# ─── Validation ───

ROLE_NAME_PATTERN = re.compile(r"^[a-z][a-z0-9_]{2,29}$")
VALID_PERMISSIONS = set(PERMISSION_LEVELS)  # {"none", "read", "write", "full"}


def _validate_role_name(name: str):
    """Validate role name format: lowercase alphanumeric + underscore, 3-30 chars."""
    if not ROLE_NAME_PATTERN.match(name):
        raise HTTPException(
            status_code=400,
            detail="Role name must be 3-30 characters, lowercase letters/numbers/underscores, starting with a letter.",
        )


def _validate_permissions(permissions: dict):
    """Validate that all permission values are valid levels and keys are known modules."""
    for module, level in permissions.items():
        if module not in MODULE_META:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown module '{module}'. Valid modules: {', '.join(MODULE_META.keys())}",
            )
        if level not in VALID_PERMISSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid permission level '{level}' for module '{module}'. Valid: {', '.join(VALID_PERMISSIONS)}",
            )


def _log_audit(db: Session, admin: models.User, target_name: str, action: str, details: dict = None):
    """Record a role management action in the audit trail."""
    entry = models.UserAuditLog(
        timestamp=datetime.datetime.utcnow(),
        admin_username=admin.username,
        target_username=target_name,  # Role name as target
        target_user_id=None,
        action=action,
        details=details,
    )
    db.add(entry)


# ─── Endpoints ───

@router.get("", response_model=List[schemas.RoleWithUsers])
@router.get("/", response_model=List[schemas.RoleWithUsers])
async def list_roles(
    db: Session = Depends(database.get_db),
    _admin: models.User = Depends(require_role(ROLE_ADMIN)),
):
    """List all roles with the count of users assigned to each."""
    roles = db.query(models.Role).order_by(models.Role.id).all()

    # Count active (non-deleted) users per role
    user_counts = dict(
        db.query(models.User.role, func.count(models.User.id))
        .filter(models.User.is_deleted == False)
        .group_by(models.User.role)
        .all()
    )

    result = []
    for role in roles:
        role_dict = schemas.Role.model_validate(role).model_dump()
        role_dict["user_count"] = user_counts.get(role.name, 0)
        result.append(role_dict)

    return result


@router.get("/modules-meta")
async def get_modules_meta(
    _admin: models.User = Depends(require_role(ROLE_ADMIN)),
):
    """Get module metadata (icons, labels) and valid permission levels for the UI."""
    return {
        "modules": MODULE_META,
        "permission_levels": PERMISSION_LEVELS,
    }


@router.get("/{role_id}", response_model=schemas.RoleWithUsers)
async def get_role(
    role_id: int,
    db: Session = Depends(database.get_db),
    _admin: models.User = Depends(require_role(ROLE_ADMIN)),
):
    """Get a single role by ID."""
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    user_count = db.query(func.count(models.User.id)).filter(
        models.User.role == role.name,
        models.User.is_deleted == False,
    ).scalar()

    role_dict = schemas.Role.model_validate(role).model_dump()
    role_dict["user_count"] = user_count
    return role_dict


@router.post("", response_model=schemas.Role, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=schemas.Role, status_code=status.HTTP_201_CREATED)
async def create_role(
    role_data: schemas.RoleCreate,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(require_role(ROLE_ADMIN)),
):
    """Create a new custom role."""
    name = role_data.name.strip().lower()
    _validate_role_name(name)
    _validate_permissions(role_data.permissions)

    # Check duplicate
    existing = db.query(models.Role).filter(func.lower(models.Role.name) == name).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Role '{name}' already exists")

    # Ensure all modules have a permission entry (default to "none" for unspecified)
    full_permissions = {mod: "none" for mod in MODULE_META}
    full_permissions.update(role_data.permissions)

    try:
        role = models.Role(
            name=name,
            label=role_data.label.strip(),
            description=role_data.description.strip() if role_data.description else None,
            permissions=full_permissions,
            is_builtin=False,
        )
        db.add(role)
        db.flush()

        _log_audit(db, admin, name, "create_role", {
            "label": role.label,
            "permissions": full_permissions,
        })

        db.commit()
        db.refresh(role)
        return role
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to create role: {str(e)}")


@router.put("/{role_id}", response_model=schemas.Role)
async def update_role(
    role_id: int,
    role_data: schemas.RoleUpdate,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(require_role(ROLE_ADMIN)),
):
    """Update a role's label, description, or permissions."""
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    # Admin role is fully locked
    if role.name == "admin":
        raise HTTPException(status_code=403, detail="The admin role cannot be modified")

    changes = {}

    if role_data.label is not None:
        new_label = role_data.label.strip()
        if role.label != new_label:
            changes["label"] = {"old": role.label, "new": new_label}
        role.label = new_label

    if role_data.description is not None:
        new_desc = role_data.description.strip() if role_data.description else None
        if role.description != new_desc:
            changes["description"] = {"old": role.description, "new": new_desc}
        role.description = new_desc

    if role_data.permissions is not None:
        _validate_permissions(role_data.permissions)
        # Merge with full module list
        full_permissions = {mod: "none" for mod in MODULE_META}
        full_permissions.update(role_data.permissions)
        if role.permissions != full_permissions:
            changes["permissions"] = {"old": role.permissions, "new": full_permissions}
        role.permissions = full_permissions

    if changes:
        _log_audit(db, admin, role.name, "update_role_permissions", changes)

    db.commit()
    db.refresh(role)
    return role


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_role(
    role_id: int,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(require_role(ROLE_ADMIN)),
):
    """Delete a custom role. Cannot delete built-in roles or roles with assigned users."""
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    if role.is_builtin:
        raise HTTPException(status_code=403, detail=f"Built-in role '{role.name}' cannot be deleted")

    # Check if any active users are assigned
    user_count = db.query(func.count(models.User.id)).filter(
        models.User.role == role.name,
        models.User.is_deleted == False,
    ).scalar()

    if user_count > 0:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot delete role '{role.name}': {user_count} active user(s) are assigned to it. Reassign them first.",
        )

    _log_audit(db, admin, role.name, "delete_role", {
        "label": role.label,
        "permissions": role.permissions,
    })

    db.delete(role)
    db.commit()
