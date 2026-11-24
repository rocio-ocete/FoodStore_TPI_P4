from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.deps import require_role
from app.core.models import Usuario
from app.modules.schemas import UserPublic

router=APIRouter(prefix="/admin/usuarios",tags=["Usuarios"]);admin=Depends(require_role("admin"))
@router.get("",response_model=list[UserPublic])
def listing(_=admin,s:Session=Depends(get_session)):return s.exec(select(Usuario)).all()
def set_disabled(id:int,value:bool,s:Session):
 u=s.get(Usuario,id)
 if not u:raise HTTPException(404,"Usuario no encontrado")
 u.disabled=value;s.add(u);s.commit();s.refresh(u);return u
@router.post("/{id}/activar",response_model=UserPublic)
def activate(id:int,_=admin,s:Session=Depends(get_session)):return set_disabled(id,False,s)
@router.post("/{id}/desactivar",response_model=UserPublic)
def deactivate(id:int,a:Usuario=admin,s:Session=Depends(get_session)):
 if a.id==id:raise HTTPException(400,"No podés desactivarte a vos mismo")
 return set_disabled(id,True,s)
