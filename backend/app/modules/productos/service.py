from sqlalchemy.orm import selectinload
from sqlmodel import select

from app.core.models import Categoria, Producto
from app.modules.productos.unit_of_work import ProductoUnitOfWork


class ProductoService:
 def list(self,skip=0,limit=20,search=None,categoria_id=None,disponible=None):
  with ProductoUnitOfWork() as u:
   q=select(Producto).options(selectinload(Producto.categoria)).where(Producto.activo==True)
   if search:q=q.where(Producto.nombre.ilike(f"%{search}%"))
   if categoria_id:q=q.where(Producto.categoria_id==categoria_id)
   if disponible is not None:q=q.where(Producto.disponible==disponible)
   allp=u.session.exec(q).all(); return {"total":len(allp),"items":allp[skip:skip+limit]}
 def get(self,id):
  with ProductoUnitOfWork() as u:
   p=u.productos.get_by_id(id)
   if not p or not p.activo:raise LookupError("Producto no encontrado")
   _=p.categoria
   return p
 def create(self,d):
  with ProductoUnitOfWork() as u:
   c=u.categorias.get_by_id(d.categoria_id)
   if not c or not c.activo:raise LookupError("Categoría inexistente o inactiva")
   p=u.productos.add(Producto(**d.model_dump()));_=p.categoria;return p
 def update(self,id,d):
  with ProductoUnitOfWork() as u:
   p=u.productos.get_by_id(id)
   if not p or not p.activo:raise LookupError("Producto no encontrado")
   c=u.categorias.get_by_id(d.categoria_id)
   if not c or not c.activo:raise LookupError("Categoría inexistente o inactiva")
   for k,v in d.model_dump(exclude_unset=True).items():setattr(p,k,v)
   u.session.add(p);u.session.flush();_=p.categoria;return p
 def stock(self,id,d):
  with ProductoUnitOfWork() as u:
   p=u.productos.get_by_id(id)
   if not p or not p.activo:raise LookupError("Producto no encontrado")
   p.stock=d.stock;p.disponible=d.disponible;u.session.add(p);u.session.flush();_=p.categoria;return p
 def delete(self,id):
  with ProductoUnitOfWork() as u:
   p=u.productos.get_by_id(id)
   if not p or not p.activo:raise LookupError("Producto no encontrado")
   p.activo=False
