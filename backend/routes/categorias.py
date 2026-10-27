"""
SegurIA — Rutas de Categorías
"""

from fastapi import APIRouter, HTTPException, status
import pymysql
from database import get_db_connection

router = APIRouter(prefix="/api/categorias", tags=["Categorías"])


@router.get("/")
def get_categorias():
    """
    Obtiene todas las categorías de incidentes registradas en MySQL.
    """
    try:
        conn = get_db_connection(use_database=True)
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, nombre FROM categorias ORDER BY id ASC;")
            categorias = cursor.fetchall()
        conn.close()
        return categorias
    except pymysql.MySQLError as err:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Error al consultar categorías en MySQL: {str(err)}"
        )
