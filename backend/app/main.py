from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core import models
from app.core.config import settings
from app.core.database import create_all_tables
from app.modules.auth.router import router as auth_router
from app.modules.categorias.router import router as categorias_router
from app.modules.pedidos.router import router as pedidos_router
from app.modules.productos.router import router as productos_router
from app.modules.usuarios.router import router as usuarios_router

app = FastAPI(
    title="Food Store API",
    version="1.0.0",
    description="API de pedidos, catálogo y administración Food Store",
)

allowed_origins = list(
    {
        settings.FRONTEND_ORIGIN.rstrip("/"),
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    }
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    create_all_tables()


@app.get("/api/v1/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "food-store"}


for router in [
    auth_router,
    usuarios_router,
    categorias_router,
    productos_router,
    pedidos_router,
]:
    app.include_router(router, prefix="/api/v1")
