from sqlmodel import Session, select


class BaseRepository:
    def __init__(self, session: Session, model): self.session=session; self.model=model
    def get_by_id(self, id): return self.session.get(self.model,id)
    def get_all(self): return self.session.exec(select(self.model)).all()
    def add(self, obj): self.session.add(obj); self.session.flush(); self.session.refresh(obj); return obj
    def delete(self,obj): self.session.delete(obj)
