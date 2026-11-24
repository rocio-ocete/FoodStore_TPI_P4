from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, Relationship, SQLModel


class Usuario(SQLModel, table=True):
 id: Optional[int]=Field(default=None,primary_key=True)
 username:str=Field(index=True,unique=True); full_name:str; email:str=Field(index=True,unique=True); hashed_password:str; role:str="user"; disabled:bool=False; created_at:datetime=Field(default_factory=lambda:datetime.now(timezone.utc)); pedidos:list["Pedido"]=Relationship(back_populates="usuario")
class Categoria(SQLModel, table=True):
 id:Optional[int]=Field(default=None,primary_key=True); nombre:str=Field(index=True,unique=True,min_length=2,max_length=100); descripcion:Optional[str]=None; activo:bool=True; productos:list["Producto"]=Relationship(back_populates="categoria")
class Producto(SQLModel, table=True):
 id:Optional[int]=Field(default=None,primary_key=True); categoria_id:int=Field(foreign_key="categoria.id"); nombre:str; descripcion:Optional[str]=None; precio_base:float=Field(ge=0); imagen_url:Optional[str]=None; stock:int=Field(default=0,ge=0); disponible:bool=True; activo:bool=True; categoria:Categoria=Relationship(back_populates="productos"); detalles:list["DetallePedido"]=Relationship(back_populates="producto")
class Pedido(SQLModel, table=True):
 id:Optional[int]=Field(default=None,primary_key=True); usuario_id:int=Field(foreign_key="usuario.id"); estado:str="PENDIENTE"; forma_pago:str; direccion_entrega:str=Field(min_length=5,max_length=200); notas:Optional[str]=None; total:float=0; created_at:datetime=Field(default_factory=lambda:datetime.now(timezone.utc)); updated_at:datetime=Field(default_factory=lambda:datetime.now(timezone.utc)); usuario:Usuario=Relationship(back_populates="pedidos"); items:list["DetallePedido"]=Relationship(back_populates="pedido")
class DetallePedido(SQLModel,table=True):
 id:Optional[int]=Field(default=None,primary_key=True); pedido_id:int=Field(foreign_key="pedido.id"); producto_id:int=Field(foreign_key="producto.id"); cantidad:int=Field(ge=1); nombre_producto:str; precio_unitario:float; subtotal:float; pedido:Pedido=Relationship(back_populates="items"); producto:Producto=Relationship(back_populates="detalles")
