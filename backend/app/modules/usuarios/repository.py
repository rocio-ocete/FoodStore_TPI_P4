from app.core.base_repository import BaseRepository
from app.core.models import Usuario


class UsuarioRepository(BaseRepository):
 def __init__(self,session):super().__init__(session,Usuario)
