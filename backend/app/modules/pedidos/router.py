from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.deps import get_current_active_user, require_role
from app.core.models import Usuario
from app.modules.pedidos.service import PedidoService
from app.modules.schemas import CambioEstado, PedidoCreate, PedidoRead

router=APIRouter(prefix="/pedidos",tags=["Pedidos"]);svc=PedidoService()
@router.post("",response_model=PedidoRead,status_code=201)
def create(d:PedidoCreate,u:Usuario=Depends(get_current_active_user)):
 try:return svc.create(u.id,d)
 except LookupError as e:raise HTTPException(404,str(e))
 except ValueError as e:raise HTTPException(400,str(e))
@router.get("")
def listing(skip:int=0,limit:int=Query(20,le=100),estado:str|None=None,u:Usuario=Depends(get_current_active_user)):return svc.list(u,skip,limit,estado)
@router.get("/resumen")
def summary(_=Depends(require_role("admin"))):return svc.summary()
@router.get("/{id}",response_model=PedidoRead)
def detail(id:int,u:Usuario=Depends(get_current_active_user)):
 try:return svc.get(id,u)
 except LookupError as e:raise HTTPException(404,str(e))
 except PermissionError as e:raise HTTPException(403,str(e))
@router.patch("/{id}/estado",response_model=PedidoRead)
def change(id:int,d:CambioEstado,_=Depends(require_role("admin"))):
 try:return svc.change(id,d.estado,_,False)
 except LookupError as e:raise HTTPException(404,str(e))
 except ValueError as e:raise HTTPException(400,str(e))
@router.patch("/{id}/cancelar",response_model=PedidoRead)
def cancel(id:int,u:Usuario=Depends(get_current_active_user)):
 try:return svc.change(id,"CANCELADO",u,True)
 except LookupError as e:raise HTTPException(404,str(e))
 except PermissionError as e:raise HTTPException(403,str(e))
 except ValueError as e:raise HTTPException(400,str(e))
