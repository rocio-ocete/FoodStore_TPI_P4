
from datetime import datetime
from typing import Optional

from pydantic import field_validator
from sqlmodel import Field, SQLModel


class UserCreate(SQLModel):
    username: str
    full_name: str
    email: str
    password: str = Field(min_length=8)


class UserPublic(SQLModel):
    id: int
    username: str
    full_name: str
    email: str
    role: str
    disabled: bool
    created_at: datetime


class CategoriaIn(SQLModel):
    nombre: str = Field(min_length=2, max_length=100)
    descripcion: Optional[str] = None


class CategoriaRead(CategoriaIn):
    id: int
    activo: bool


class ProductoIn(SQLModel):
    categoria_id: int
    nombre: str
    descripcion: Optional[str] = None
    precio_base: float = Field(ge=0)
    imagen_url: str = Field(min_length=1)
    stock: int = Field(default=0, ge=0)
    disponible: bool = True

    @field_validator("imagen_url")
    @classmethod
    def validar_imagen_url(cls, value: str) -> str:
        value = value.strip()

        if not value.startswith(("http://", "https://")):
            raise ValueError("La URL debe comenzar con http:// o https://")

        return value


class ProductoRead(ProductoIn):
    id: int
    activo: bool
    categoria: Optional[CategoriaRead] = None


class ProductoStock(SQLModel):
    stock: int = Field(ge=0)
    disponible: bool


class ItemCreate(SQLModel):
    producto_id: int
    cantidad: int = Field(ge=1)


class PedidoCreate(SQLModel):
    items: list[ItemCreate] = Field(min_length=1)
    forma_pago: str
    direccion_entrega: str = Field(min_length=5, max_length=200)
    notas: Optional[str] = None


class DetalleRead(SQLModel):
    producto_id: int
    nombre_producto: str
    precio_unitario: float
    cantidad: int
    subtotal: float


class PedidoRead(SQLModel):
    id: int
    usuario_id: int
    estado: str
    forma_pago: str
    direccion_entrega: str
    notas: Optional[str]
    total: float
    created_at: datetime
    updated_at: datetime
    items: list[DetalleRead]


class CambioEstado(SQLModel):
    estado: str


class Resumen(SQLModel):
    pendientes: int
    en_preparacion: int
    entregados: int
    cancelados: int
    pedidos_hoy: int
    ingresos_entregados: float
