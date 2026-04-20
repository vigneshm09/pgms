from typing import Any, Dict, Iterable

from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from app.config import settings
from app.database import get_database


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def ensure_database():
    database = get_database()
    if database is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database is not configured. Add MONGO_URI to server/.env.",
        )
    return database


def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    database = ensure_database()

    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
        ) from exc

    subject = payload.get("sub")
    if not subject or not ObjectId.is_valid(subject):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
        )

    user = database.users.find_one({"_id": ObjectId(subject)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user no longer exists.",
        )

    return user


def require_roles(*roles: Iterable[str]):
    allowed_roles = set(roles)

    def dependency(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        if current_user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not allowed to access this resource.",
            )
        return current_user

    return dependency


get_admin_user = require_roles("ADMIN")
get_authenticated_user = require_roles("ADMIN", "TENANT")

