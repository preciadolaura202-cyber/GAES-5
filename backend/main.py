"""
SegurIA — Backend API en Python (FastAPI)
Conexión directa con MySQL / phpMyAdmin para registro, login y reportes comunitarios.
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from database import init_database, get_db_connection
from routes.auth import router as auth_router
from routes.categorias import router as categorias_router
from routes.reportes import router as reportes_router
from routes.admin import router as admin_router

load_dotenv()

HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", 8000))


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Verifica la conexión a MySQL e inicializa la base de datos 'seguria'
    y sus tablas al arrancar el servidor.
    """
    print("\n" + "=" * 60)
    print(">> Iniciando SegurIA Backend (Python - FastAPI)...")
    print(f">> Servidor disponible en: http://{HOST}:{PORT}")
    print(f">> Documentacion interactiva Swagger: http://{HOST}:{PORT}/docs")
    print("=" * 60)

    # Inicializar base de datos y tablas si MySQL está activo
    init_database()

    yield

    print(">> Deteniendo SegurIA Backend...")


app = FastAPI(
    title="SegurIA API",
    description="API RESTful en Python para la Plataforma Comunitaria de Seguridad Ciudadana SegurIA (GAES-5).",
    version="1.0.0",
    lifespan=lifespan
)

# Configuración de CORS universal (soporta localhost, Live Server, file:// y cualquier puerto)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Registro de rutas modulares
app.include_router(auth_router)
app.include_router(categorias_router)
app.include_router(reportes_router)
app.include_router(admin_router)


@app.get("/")
def root():
    return {
        "ok": True,
        "mensaje": "Bienvenido a la API de SegurIA (Python / FastAPI)",
        "docs": f"http://{HOST}:{PORT}/docs",
        "health": f"http://{HOST}:{PORT}/health"
    }


@app.get("/health")
def health_check():
    """
    Verifica el estado del servicio y la conexión a MySQL (phpMyAdmin).
    """
    db_ok = False
    db_msg = ""
    try:
        conn = get_db_connection(use_database=True)
        with conn.cursor() as cursor:
            cursor.execute("SELECT 1 AS test;")
            row = cursor.fetchone()
            db_ok = bool(row and row["test"] == 1)
        conn.close()
        db_msg = "Conexión a MySQL exitosa"
    except Exception as err:
        db_ok = False
        db_msg = f"MySQL desconectado: {str(err)}"

    return {
        "ok": True,
        "servicio": "SegurIA API (Python/FastAPI)",
        "mysql_conectado": db_ok,
        "detalle_mysql": db_msg
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
