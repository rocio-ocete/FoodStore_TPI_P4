from fastapi import Depends, HTTPException, Request
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.models import Usuario
from app.core.security import decode_access_token


def get_current_user(request: Request, session: Session = Depends(get_session)) -> Usuario:
    token = request.cookies.get("access_token")
    payload = decode_access_token(token) if token else None
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Sesión no válida o expirada")
    user = session.exec(select(Usuario).where(Usuario.username == payload["sub"])).first()
    if not user: raise HTTPException(status_code=401, detail="Usuario inexistente")
    return user

def get_current_active_user(user: Usuario = Depends(get_current_user)) -> Usuario:
    if user.disabled: raise HTTPException(status_code=400, detail="Cuenta de usuario desactivada")
    return user

def require_role(role: str):
    def checker(user: Usuario = Depends(get_current_active_user)):
        if user.role != role: raise HTTPException(status_code=403, detail="Permiso insuficiente")
        return user
    return checker
