"""
SegurIA — Rutas Exclusivas para Administradores
Permite gestionar usuarios, moderar reportes y administrar categorías en MySQL.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
import pymysql
from database import get_db_connection

router = APIRouter(prefix="/api/admin", tags=["Administración"])


class UpdateRoleRequest(BaseModel):
    rol: str = Field(..., description="Nuevo rol ('usuario', 'administrador', 'desarrollador')")


class NuevaCategoriaRequest(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=50)


@router.get("/usuarios")
def get_all_users():
    """
    Lista todos los usuarios registrados en MySQL con sus roles y fechas de registro.
    """
    try:
        conn = get_db_connection(use_database=True)
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT id, nombre, correo, rol, fecha_registro 
                FROM usuarios 
                ORDER BY id DESC;
            """)
            users = cursor.fetchall()
        conn.close()
        return users
    except pymysql.MySQLError as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener usuarios de MySQL: {str(err)}"
        )


@router.patch("/usuarios/{user_id}/rol")
def change_user_role(user_id: int, data: UpdateRoleRequest):
    """
    Cambia el rol de un usuario en MySQL (ej: de 'usuario' a 'administrador').
    """
    nuevo_rol = data.rol.lower().strip()
    if nuevo_rol not in ("usuario", "administrador", "desarrollador"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rol no permitido. Debe ser 'usuario', 'administrador' o 'desarrollador'."
        )

    try:
        conn = get_db_connection(use_database=True)
        with conn.cursor() as cursor:
            cursor.execute("UPDATE usuarios SET rol = %s WHERE id = %s;", (nuevo_rol, user_id))
            affected = cursor.rowcount
        conn.close()

        if affected == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado o ya tenía ese rol asignado."
            )

        return {
            "ok": True,
            "mensaje": f"Rol del usuario actualizado a '{nuevo_rol}' con éxito."
        }
    except HTTPException:
        raise
    except pymysql.MySQLError as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar rol en MySQL: {str(err)}"
        )


@router.delete("/reportes/{reporte_id}")
def delete_reporte(reporte_id: int):
    """
    Elimina un reporte ciudadano de la base de datos MySQL (moderación).
    """
    try:
        conn = get_db_connection(use_database=True)
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM resenas WHERE id = %s;", (reporte_id,))
            affected = cursor.rowcount
        conn.close()

        if affected == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reporte no encontrado."
            )

        return {
            "ok": True,
            "mensaje": f"Reporte #{reporte_id} eliminado exitosamente por el administrador."
        }
    except HTTPException:
        raise
    except pymysql.MySQLError as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar reporte en MySQL: {str(err)}"
        )


@router.get("/stats")
def get_admin_stats():
    """
    Retorna métricas clave para la consola de administración C5 desde MySQL.
    """
    try:
        conn = get_db_connection(use_database=True)
        with conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) AS total FROM usuarios;")
            total_usuarios = cursor.fetchone()["total"]

            cursor.execute("SELECT COUNT(*) AS total FROM usuarios WHERE rol = 'administrador';")
            total_admins = cursor.fetchone()["total"]

            cursor.execute("SELECT COUNT(*) AS total FROM resenas;")
            total_reportes = cursor.fetchone()["total"]

            cursor.execute("SELECT COUNT(*) AS total FROM categorias;")
            total_categorias = cursor.fetchone()["total"]
        conn.close()

        return {
            "ok": True,
            "total_usuarios": total_usuarios,
            "total_admins": total_admins,
            "total_reportes": total_reportes,
            "total_categorias": total_categorias,
            "mysql_conectado": True
        }
    except pymysql.MySQLError as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener estadísticas de MySQL: {str(err)}"
        )


@router.post("/categorias", status_code=status.HTTP_201_CREATED)
def create_categoria(data: NuevaCategoriaRequest):
    """
    Agrega una nueva categoría de incidente a MySQL.
    """
    nombre = data.nombre.strip()
    try:
        conn = get_db_connection(use_database=True)
        with conn.cursor() as cursor:
            cursor.execute("INSERT INTO categorias (nombre) VALUES (%s);", (nombre,))
            new_id = cursor.lastrowid
        conn.close()
        return {
            "ok": True,
            "mensaje": f"Categoría '{nombre}' creada con éxito.",
            "categoria": {"id": new_id, "nombre": nombre}
        }
    except pymysql.MySQLError as err:
        if err.args[0] == 1062:  # Duplicate entry
            raise HTTPException(status_code=409, detail="Esa categoría ya existe.")
        raise HTTPException(status_code=500, detail=str(err))


@router.delete("/categorias/{cat_id}")
def delete_categoria(cat_id: int):
    """
    Elimina una categoría de incidentes en MySQL.
    """
    try:
        conn = get_db_connection(use_database=True)
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM categorias WHERE id = %s;", (cat_id,))
            affected = cursor.rowcount
        conn.close()

        if affected == 0:
            raise HTTPException(status_code=404, detail="Categoría no encontrada.")

        return {"ok": True, "mensaje": f"Categoría #{cat_id} eliminada con éxito."}
    except HTTPException:
        raise
    except pymysql.MySQLError as err:
        raise HTTPException(status_code=500, detail=str(err))

