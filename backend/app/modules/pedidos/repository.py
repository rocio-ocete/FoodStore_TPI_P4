from app.core.base_repository import BaseRepository
from app.core.models import Pedido


class PedidoRepository(BaseRepository):
    def __init__(self, session): super().__init__(session, Pedido)
