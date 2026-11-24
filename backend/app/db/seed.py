from sqlmodel import Session, select

from app.core.database import create_all_tables, engine
from app.core.models import Categoria, Producto, Usuario
from app.core.security import hash_password


def seed():
    create_all_tables()
    with Session(engine) as s:
        if not s.exec(select(Usuario).where(Usuario.username == "admin")).first():
            s.add(Usuario(username="admin", full_name="Administrador", email="admin@foodstore.local", hashed_password=hash_password("Admin1234!"), role="admin"))
        categories = ["Hamburguesas", "Pizzas", "Bebidas"]
        for name in categories:
            if not s.exec(select(Categoria).where(Categoria.nombre == name)).first(): s.add(Categoria(nombre=name))
        s.commit()
        cats = {c.nombre:c.id for c in s.exec(select(Categoria)).all()}
        examples = [("Hamburguesa clásica", "Hamburguesas", 4500), ("Hamburguesa doble", "Hamburguesas", 6200), ("Pizza muzzarella", "Pizzas", 7000), ("Pizza napolitana", "Pizzas", 8200), ("Gaseosa cola", "Bebidas", 1800), ("Agua mineral", "Bebidas", 1200), ("Pizza fugazzeta", "Pizzas", 7800), ("Hamburguesa veggie", "Hamburguesas", 5100)]
        for name,cat,price in examples:
            if not s.exec(select(Producto).where(Producto.nombre == name)).first(): s.add(Producto(categoria_id=cats[cat], nombre=name, precio_base=price, stock=20, disponible=True))
        s.commit()
if __name__ == "__main__": seed()
