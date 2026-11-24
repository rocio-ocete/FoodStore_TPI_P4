from fastapi import HTTPException
from sqlmodel import Session, select

from app.core.models import Usuario


class UsuarioService:
 def list(self,s:Session):return s.exec(select(Usuario)).all()
 def set_disabled(self,s:Session,id:int,disabled:bool):
  u=s.get(Usuario,id)
  if not u:raise HTTPException(404,"Usuario no encontrado")
  u.disabled=disabled;s.add(u);s.commit();s.refresh(u);return u
