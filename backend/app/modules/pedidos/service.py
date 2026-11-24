from datetime import date, datetime, time, timezone

from sqlmodel import func, select

from app.core.models import DetallePedido, Pedido, Producto
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork

TRANS={"PENDIENTE":["EN_PREPARACION","CANCELADO"],"EN_PREPARACION":["ENTREGADO","CANCELADO"],"ENTREGADO":[],"CANCELADO":[]}
class PedidoService:
 def create(self,user_id,d):
  ids=[i.producto_id for i in d.items]
  if len(ids)!=len(set(ids)):raise ValueError("No se permiten productos repetidos")
  if d.forma_pago not in ("EFECTIVO","TRANSFERENCIA"):raise ValueError("Forma de pago inválida")
  with PedidoUnitOfWork() as u:
   order=Pedido(usuario_id=user_id,forma_pago=d.forma_pago,direccion_entrega=d.direccion_entrega,notas=d.notas,total=0);u.pedidos.add(order);total=0
   for item in d.items:
    p=u.session.exec(select(Producto).where(Producto.id==item.producto_id).with_for_update()).first()
    if not p or not p.activo:raise LookupError("Producto inexistente o inactivo")
    if not p.disponible:raise ValueError(f"{p.nombre} no está disponible")
    if p.stock<item.cantidad:raise ValueError(f"Stock insuficiente para {p.nombre}")
    p.stock-=item.cantidad;sub=p.precio_base*item.cantidad;total+=sub
    u.session.add(DetallePedido(pedido_id=order.id,producto_id=p.id,cantidad=item.cantidad,nombre_producto=p.nombre,precio_unitario=p.precio_base,subtotal=sub))
   order.total=total;u.session.add(order);u.session.flush();u.session.refresh(order);_=list(order.items);return order
 def list(self,user,skip=0,limit=20,estado=None):
  with PedidoUnitOfWork() as u:
   q=select(Pedido)
   if user.role!="admin":q=q.where(Pedido.usuario_id==user.id)
   if estado:q=q.where(Pedido.estado==estado)
   allp=u.session.exec(q.order_by(Pedido.created_at.desc())).all();[list(x.items) for x in allp];return {"total":len(allp),"items":allp[skip:skip+limit]}
 def get(self,id,user):
  with PedidoUnitOfWork() as u:
   p=u.pedidos.get_by_id(id)
   if not p:raise LookupError("Pedido no encontrado")
   if user.role!="admin" and p.usuario_id!=user.id:raise PermissionError("El pedido pertenece a otro usuario")
   _=list(p.items)
   return p
 def change(self,id,new,user,owner=False):
  with PedidoUnitOfWork() as u:
   p=u.pedidos.get_by_id(id)
   if not p:raise LookupError("Pedido no encontrado")
   if owner and p.usuario_id!=user.id:raise PermissionError("El pedido pertenece a otro usuario")
   if new not in TRANS.get(p.estado,[]):raise ValueError("Transición de estado inválida")
   if owner and p.estado!="PENDIENTE":raise ValueError("Solo se cancelan pedidos pendientes")
   if new=="CANCELADO":
    for line in p.items:
     product=u.productos.get_by_id(line.producto_id)
     if product:product.stock+=line.cantidad;u.session.add(product)
   p.estado=new;p.updated_at=datetime.now(timezone.utc);u.session.add(p);u.session.flush();u.session.refresh(p);_=list(p.items);return p
 def summary(self):
  with PedidoUnitOfWork() as u:
   counts={s:len(u.session.exec(select(Pedido).where(Pedido.estado==s)).all()) for s in TRANS}
   today=date.today();start=datetime.combine(today,time.min,tzinfo=timezone.utc);end=datetime.combine(today,time.max,tzinfo=timezone.utc);today_orders=u.session.exec(select(Pedido).where(Pedido.created_at>=start,Pedido.created_at<=end)).all()
   delivered=u.session.exec(select(Pedido).where(Pedido.estado=="ENTREGADO")).all()
   return {"pendientes":counts["PENDIENTE"],"en_preparacion":counts["EN_PREPARACION"],"entregados":counts["ENTREGADO"],"cancelados":counts["CANCELADO"],"pedidos_hoy":len(today_orders),"ingresos_entregados":sum(x.total for x in delivered)}
