from sqlmodel import select

from app.core.models import Categoria, Producto
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork


class CategoriaService:
 def list(self):
  with CategoriaUnitOfWork() as u: return u.session.exec(select(Categoria).where(Categoria.activo==True)).all()
 def get(self,id):
  with CategoriaUnitOfWork() as u:
   x=u.categorias.get_by_id(id)
   if not x or not x.activo: raise LookupError("Categoría no encontrada")
   return x
 def create(self,d):
  with CategoriaUnitOfWork() as u:
   if u.session.exec(select(Categoria).where(Categoria.nombre==d.nombre)).first(): raise ValueError("Ya existe una categoría con ese nombre")
   return u.categorias.add(Categoria(**d.model_dump()))
 def update(self,id,d):
  with CategoriaUnitOfWork() as u:
   x=u.categorias.get_by_id(id)
   if not x or not x.activo: raise LookupError("Categoría no encontrada")
   if d.nombre != x.nombre and u.session.exec(select(Categoria).where(Categoria.nombre==d.nombre)).first(): raise ValueError("Ya existe una categoría con ese nombre")
   for k,v in d.model_dump(exclude_unset=True).items(): setattr(x,k,v)
   u.session.add(x); u.session.flush(); return x
 def delete(self,id):
  with CategoriaUnitOfWork() as u:
   x=u.categorias.get_by_id(id)
   if not x or not x.activo: raise LookupError("Categoría no encontrada")
   x.activo=False
   for p in u.session.exec(select(Producto).where(Producto.categoria_id==id)).all(): p.activo=False
