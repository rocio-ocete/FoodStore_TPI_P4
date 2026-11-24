from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.deps import require_role
from app.modules.productos.service import ProductoService
from app.modules.schemas import ProductoIn, ProductoRead, ProductoStock

router=APIRouter(prefix="/productos",tags=["Productos"]);svc=ProductoService()
@router.get("")
def listing(skip:int=0,limit:int=Query(20,le=100),search:str|None=None,categoria_id:int|None=None,disponible:bool|None=None):return svc.list(skip,limit,search,categoria_id,disponible)
@router.get("/{id}",response_model=ProductoRead)
def detail(id:int):
 try:return svc.get(id)
 except LookupError as e:raise HTTPException(404,str(e))
@router.post("",response_model=ProductoRead,status_code=201)
def create(d:ProductoIn,_=Depends(require_role("admin"))):
 try:return svc.create(d)
 except LookupError as e:raise HTTPException(404,str(e))
@router.put("/{id}",response_model=ProductoRead)
def update(id:int,d:ProductoIn,_=Depends(require_role("admin"))):
 try:return svc.update(id,d)
 except LookupError as e:raise HTTPException(404,str(e))
@router.patch("/{id}/stock",response_model=ProductoRead)
def stock(id:int,d:ProductoStock,_=Depends(require_role("admin"))):
 try:return svc.stock(id,d)
 except LookupError as e:raise HTTPException(404,str(e))
@router.delete("/{id}",status_code=204)
def delete(id:int,_=Depends(require_role("admin"))):
 try:svc.delete(id);return None
 except LookupError as e:raise HTTPException(404,str(e))
