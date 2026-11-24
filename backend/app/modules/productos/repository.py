from app.core.base_repository import BaseRepository
from app.core.models import Producto


class ProductoRepository(BaseRepository):
    def __init__(self, session): super().__init__(session, Producto)
