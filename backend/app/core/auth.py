"""
Authentication & Role-Based Access Control (RBAC).

Provides:
- Password hashing and verification
- JWT creation and decoding with role embedded in payload
- `get_current_user` dependency — extracts and validates the user from JWT
- `require_role(*roles)` factory — restricts endpoints to specific roles
- `require_module(module, permission)` factory — per-module permission checks

Role Hierarchy:
  admin > accountant, clerk, storekeeper > viewer

Permission Matrix (module → allowed roles):
  seva:         admin, clerk
  customers:    admin, clerk
  accounting:   admin, accountant
  assets:       admin, storekeeper
  consumables:  admin, storekeeper
  donations:    admin, accountant, clerk, storekeeper
  settings:     admin
  users:        admin
"""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.models import models
from app import database
from app.core.config import get_settings

settings = get_settings()

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/token", auto_error=False)

# ─── Role Constants ───
ROLE_ADMIN = "admin"
ROLE_ACCOUNTANT = "accountant"
ROLE_CLERK = "clerk"
ROLE_STOREKEEPER = "storekeeper"
ROLE_VIEWER = "viewer"

ALL_ROLES = [ROLE_ADMIN, ROLE_ACCOUNTANT, ROLE_CLERK, ROLE_STOREKEEPER, ROLE_VIEWER]

# Role metadata — business-friendly labels for UI
ROLE_META = {
    ROLE_ADMIN:       {"label": "Manager",      "description": "Full access to all modules and system settings"},
    ROLE_ACCOUNTANT:  {"label": "Accountant",   "description": "Accounting, financial reports, and donations"},
    ROLE_CLERK:       {"label": "Assistant",     "description": "Seva booking, devotee management, and donations"},
    ROLE_STOREKEEPER: {"label": "Storekeeper",  "description": "Assets, consumables inventory, and donations"},
    ROLE_VIEWER:      {"label": "Viewer",        "description": "Read-only access to all modules"},
}

# Module metadata — icons and labels for the permissions UI
MODULE_META = {
    "seva":        {"label": "Seva Booking",  "icon": "🙏"},
    "customers":   {"label": "Devotees",      "icon": "👥"},
    "accounting":  {"label": "Accounting",    "icon": "📊"},
    "assets":      {"label": "Assets",        "icon": "🏛️"},
    "consumables": {"label": "Consumables",   "icon": "📦"},
    "donations":   {"label": "Donations",     "icon": "🎁"},
    "settings":    {"label": "Settings",      "icon": "⚙️"},
    "users":       {"label": "Users",         "icon": "👤"},
}

PERMISSION_LEVELS = ["none", "read", "write", "full"]

# Default module-to-role permission mapping
MODULE_PERMISSIONS = {
    "seva":         {ROLE_ADMIN, ROLE_CLERK},
    "customers":    {ROLE_ADMIN, ROLE_CLERK},
    "accounting":   {ROLE_ADMIN, ROLE_ACCOUNTANT},
    "assets":       {ROLE_ADMIN, ROLE_STOREKEEPER},
    "consumables":  {ROLE_ADMIN, ROLE_STOREKEEPER},
    "donations":    {ROLE_ADMIN, ROLE_ACCOUNTANT, ROLE_CLERK, ROLE_STOREKEEPER},
    "settings":     {ROLE_ADMIN},
    "users":        {ROLE_ADMIN},
}


# ─── Password Utilities ───

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


# ─── JWT Token ───

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT token. The `data` dict should include:
    - "sub": username
    - "role": user's role string
    - "modules": optional per-module overrides dict
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ─── Dependencies ───

async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(database.get_db),
) -> models.User:
    """
    Extract the current user from the JWT bearer token.
    Returns the User ORM object with role, is_active, etc.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if token is None:
        raise credentials_exception

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None or getattr(user, "is_deleted", False):
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )
    return user


async def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(database.get_db),
) -> Optional[models.User]:
    """
    Like get_current_user but returns None if no token is provided
    instead of raising 401. Useful for endpoints that work for both
    authenticated and anonymous users.
    """
    if token is None:
        return None
    try:
        return await get_current_user(token=token, db=db)
    except HTTPException:
        return None


def require_role(*allowed_roles: str):
    """
    Factory that creates a FastAPI dependency restricting access to specific roles.

    Usage:
        @app.get("/admin-only", dependencies=[Depends(require_role("admin"))])
        async def admin_endpoint():
            ...

    Or as a direct dependency to get the user:
        async def handler(user=Depends(require_role("admin", "accountant"))):
            ...
    """
    async def _check_role(user: models.User = Depends(get_current_user)) -> models.User:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required: {', '.join(allowed_roles)}. Your role: {user.role}",
            )
        return user
    return _check_role


def require_module(module: str, permission: str = "read"):
    """
    Factory that creates a FastAPI dependency restricting access to a specific module.
    Checks:
    1. The user's role is in the module's default allowed roles
    2. If the user has per-module overrides in `user.modules`, those take precedence

    Permission levels: "read" (view), "write" (create/update), "full" (all including delete)

    Usage:
        @app.get("/accounting/journal", dependencies=[Depends(require_module("accounting"))])
        async def get_journal():
            ...
    """
    async def _check_module(user: models.User = Depends(get_current_user)) -> models.User:
        # Admin always has full access
        if user.role == ROLE_ADMIN:
            return user

        # Check per-user module overrides first
        if user.modules and module in user.modules:
            user_perm = user.modules[module]
            if user_perm == "none":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access to '{module}' module is explicitly denied for your account.",
                )
            # "read" allows read, "write" allows read+write, "full" allows everything
            perm_levels = {"read": 0, "write": 1, "full": 2}
            required_level = perm_levels.get(permission, 0)
            user_level = perm_levels.get(user_perm, 0)
            if user_level < required_level:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Insufficient permission for '{module}'. Required: {permission}, yours: {user_perm}",
                )
            return user

        # Fall back to default role-based module access
        allowed = MODULE_PERMISSIONS.get(module, set())
        # Viewer can always read
        if permission == "read" and user.role == ROLE_VIEWER:
            return user
        if user.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Your role '{user.role}' does not have access to the '{module}' module.",
            )
        return user

    return _check_module


def get_user_accessible_modules(user: models.User) -> list[dict]:
    """
    Returns a list of modules the user can access, for frontend sidebar rendering.
    Each entry: {"module": "accounting", "permission": "full"|"read"|"write"}
    """
    if user.role == ROLE_ADMIN:
        return [{"module": m, "permission": "full"} for m in MODULE_PERMISSIONS.keys()]

    accessible = []
    for module, allowed_roles in MODULE_PERMISSIONS.items():
        # Check per-user overrides
        if user.modules and module in user.modules:
            perm = user.modules[module]
            if perm != "none":
                accessible.append({"module": module, "permission": perm})
            continue

        # Default: role-based
        if user.role in allowed_roles:
            accessible.append({"module": module, "permission": "full"})
        elif user.role == ROLE_VIEWER:
            accessible.append({"module": module, "permission": "read"})

    return accessible


def get_permission_matrix() -> dict:
    """
    Build the full role→module→default-permission matrix for the frontend.
    Returns a dict of {role: {module: permission_level}} for every role.
    """
    matrix = {}
    for role in ALL_ROLES:
        modules = {}
        for module in MODULE_PERMISSIONS:
            if role == ROLE_ADMIN:
                modules[module] = "full"
            elif role in MODULE_PERMISSIONS[module]:
                modules[module] = "full"
            elif role == ROLE_VIEWER:
                modules[module] = "read"
            else:
                modules[module] = "none"
        matrix[role] = modules
    return matrix
