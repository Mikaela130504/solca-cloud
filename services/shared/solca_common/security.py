import os
from datetime import datetime, timedelta, timezone
from typing import Iterable

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer


JWT_SECRET = os.getenv("JWT_SECRET", "solca-cloud-secret")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
bearer_scheme = HTTPBearer()


DEMO_USERS = {
    "admin": {"password": "admin123", "role": "ADMIN"},
    "dr.perez": {"password": "medico123", "role": "MEDICO"},
    "lab.suarez": {"password": "lab123", "role": "LABORATORIO"},
}


def create_token(username: str, role: str) -> str:
    payload = {
        "sub": username,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=8),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return {"username": payload["sub"], "role": payload["role"]}
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalido o expirado",
        ) from exc


def require_roles(*roles: str):
    allowed: Iterable[str] = set(roles)

    def dependency(user: dict = Depends(current_user)) -> dict:
        if user["role"] not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Rol requerido: {', '.join(roles)}",
            )
        return user

    return dependency

