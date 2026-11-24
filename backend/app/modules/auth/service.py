from fastapi import HTTPException
from sqlmodel import Session, select

from app.core.models import Usuario
from app.core.security import hash_password, verify_password


class AuthService:
 def register(self,session:Session,data):
  if session.exec(select(Usuario).where((Usuario.username==data.username)|(Usuario.email==data.email))).first():raise HTTPException(409,"El username o email ya existe")
  u=Usuario(username=data.username,full_name=data.full_name,email=data.email,hashed_password=hash_password(data.password));session.add(u);session.commit();session.refresh(u);return u
 def authenticate(self,session:Session,username,password):
  u=session.exec(select(Usuario).where(Usuario.username==username)).first()
  if not u or not verify_password(password,u.hashed_password):raise HTTPException(401,"Credenciales incorrectas")
  if u.disabled:raise HTTPException(400,"Cuenta de usuario desactivada")
  return u
