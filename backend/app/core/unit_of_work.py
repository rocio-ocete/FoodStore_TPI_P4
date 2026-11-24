
from sqlmodel import Session

from app.core.base_repository import BaseRepository
from app.core.database import engine
from app.core.models import Categoria, Pedido, Producto, Usuario


class UnitOfWork:

    def __init__(self):
        self.session = None

    def __enter__(self):
        self.session = Session(
            engine,
            expire_on_commit=False,
        )

        self.categorias = BaseRepository(
            self.session,
            Categoria,
        )
        self.productos = BaseRepository(
            self.session,
            Producto,
        )
        self.pedidos = BaseRepository(
            self.session,
            Pedido,
        )
        self.usuarios = BaseRepository(
            self.session,
            Usuario,
        )

        return self

    def __exit__(self, exc_type, exc, tb):
        try:
            if exc_type is None:
                self.session.commit()
            else:
                self.session.rollback()
        finally:
            self.session.close()

        return False
