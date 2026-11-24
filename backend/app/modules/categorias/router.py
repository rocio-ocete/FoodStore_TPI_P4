
from fastapi import APIRouter, Depends, HTTPException, Response

from app.core.deps import require_role
from app.modules.categorias.service import CategoriaService
from app.modules.schemas import CategoriaIn, CategoriaRead

router = APIRouter(
    prefix="/categorias",
    tags=["Categorías"],
)

svc = CategoriaService()


@router.get("", response_model=list[CategoriaRead])
def listing():
    try:
        return svc.list()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al listar categorías: {str(e)}",
        )


@router.get("/{id}", response_model=CategoriaRead)
def detail(id: int):
    try:
        return svc.get(id)
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("", response_model=CategoriaRead, status_code=201)
def create(
    data: CategoriaIn,
    _=Depends(require_role("admin")),
):
    try:
        return svc.create(data)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.put("/{id}", response_model=CategoriaRead)
def update(
    id: int,
    data: CategoriaIn,
    _=Depends(require_role("admin")),
):
    try:
        return svc.update(id, data)
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.delete("/{id}", status_code=204)
def delete(
    id: int,
    _=Depends(require_role("admin")),
):
    try:
        svc.delete(id)
        return Response(status_code=204)
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))
