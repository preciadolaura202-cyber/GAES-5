"""
SegurIA — Rutas de Reportes y Reseñas
Permite listar y crear reportes ciudadanos vinculados a la base de datos MySQL.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
import pymysql
from database import get_db_connection

router = APIRouter(tags=["Reportes"])


class ReporteCreate(BaseModel):
    titulo: str = Field(..., min_length=3, max_length=150)
    descripcion: str = Field(..., min_length=5)
    categoria_id: Optional[int] = None
    categoriaId: Optional[int] = None
    usuario_id: Optional[int] = None
    usuarioId: Optional[int] = None
    latitud: Optional[float] = None
    lat: Optional[float] = None
    longitud: Optional[float] = None
    lng: Optional[float] = None


@router.get("/api/reportes")
@router.get("/api/resenas")
def get_reportes():
    """
    Lista todos los reportes de incidentes almacenados en MySQL junto a su categoría y usuario.
    """
    try:
        conn = get_db_connection(use_database=True)
        with conn.cursor() as cursor:
            sql = """
                SELECT 
                    r.id,
                    r.titulo,
                    r.descripcion,
                    r.latitud AS lat,
                    r.longitud AS lng,
                    r.fecha,
                    c.id AS categoria_id,
                    c.nombre AS categoria,
                    u.id AS usuario_id,
                    u.nombre AS autor
                FROM resenas r
                JOIN categorias c ON r.categoria_id = c.id
                JOIN usuarios u ON r.usuario_id = u.id
                ORDER BY r.fecha DESC;
            """
            cursor.execute(sql)
            reportes = cursor.fetchall()
        conn.close()
        return reportes
    except pymysql.MySQLError as err:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Error al consultar reportes en MySQL: {str(err)}"
        )


@router.post("/api/reportes", status_code=status.HTTP_201_CREATED)
@router.post("/api/resenas", status_code=status.HTTP_201_CREATED)
def create_reporte(data: ReporteCreate):
    """
    Guarda un nuevo reporte ciudadano en la tabla 'resenas' de MySQL.
    """
    cat_id = data.categoria_id or data.categoriaId or 1
    lat = data.latitud if data.latitud is not None else (data.lat or 4.6097)
    lng = data.longitud if data.longitud is not None else (data.lng or -74.0817)

    try:
        conn = get_db_connection(use_database=True)
        with conn.cursor() as cursor:
            # Obtener el primer usuario si no se especifica
            usr_id = data.usuario_id or data.usuarioId
            if not usr_id:
                cursor.execute("SELECT id FROM usuarios LIMIT 1;")
                usr = cursor.fetchone()
                usr_id = usr["id"] if usr else None

            if not usr_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No se encontró un usuario para vincular el reporte. Registra un usuario primero."
                )

            sql = """
                INSERT INTO resenas (usuario_id, categoria_id, titulo, descripcion, latitud, longitud)
                VALUES (%s, %s, %s, %s, %s, %s);
            """
            cursor.execute(sql, (usr_id, cat_id, data.titulo.strip(), data.descripcion.strip(), lat, lng))
            nuevo_id = cursor.lastrowid
        conn.close()

        return {
            "ok": True,
            "mensaje": "Reporte registrado con éxito en MySQL.",
            "reporte": {
                "id": nuevo_id,
                "titulo": data.titulo,
                "categoria_id": cat_id,
                "lat": lat,
                "lng": lng
            }
        }
    except HTTPException:
        raise
    except pymysql.MySQLError as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al guardar reporte en MySQL: {str(err)}"
        )
