from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select

from app.core.config import settings
from app.core.database import get_session
from app.core.deps import get_current_active_user
from app.core.models import Usuario
from app.core.security import create_access_token, hash_password, verify_password
from app.modules.schemas import UserCreate, UserPublic

router=APIRouter(prefix="/auth",tags=["Autenticación"])
@router.post("/register",response_model=UserPublic,status_code=201)
def register(data:UserCreate,s:Session=Depends(get_session)):
 if s.exec(select(Usuario).where((Usuario.username==data.username)|(Usuario.email==data.email))).first(): raise HTTPException(409,"El username o email ya existe")
 u=Usuario(username=data.username,full_name=data.full_name,email=data.email,hashed_password=hash_password(data.password)); s.add(u); s.commit(); s.refresh(u); return u
@router.post("/token")
def login(response:Response,form:OAuth2PasswordRequestForm=Depends(),s:Session=Depends(get_session)):
 u=s.exec(select(Usuario).where(Usuario.username==form.username)).first()
 if not u or not verify_password(form.password,u.hashed_password): raise HTTPException(401,"Credenciales incorrectas")
 if u.disabled: raise HTTPException(400,"Cuenta de usuario desactivada")
 response.set_cookie("access_token",create_access_token(u.username),httponly=True,samesite="lax",secure=False,max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES*60,path="/"); return {"message":"Login exitoso"}
@router.post("/logout")
def logout(response:Response): response.delete_cookie("access_token",path="/"); return {"message":"Sesión cerrada"}
@router.get("/me",response_model=UserPublic)
def me(u:Usuario=Depends(get_current_active_user)): return u
