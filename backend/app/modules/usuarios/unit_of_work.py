from app.core.unit_of_work import UnitOfWork as BaseUnitOfWork
from app.modules.usuarios.repository import UsuarioRepository


class UsuarioUnitOfWork(BaseUnitOfWork):
 def __enter__(self):
  super().__enter__();self.usuarios=UsuarioRepository(self.session);return self
