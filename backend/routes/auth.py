"""
SegurIA — Rutas de Autenticación
Registro de usuarios en base de datos MySQL, inicio de sesión y recuperación de clave.
"""

import re
import random
import time
from typing import Optional
from fastapi import APIRouter, HTTPException, Header, status
from pydantic import BaseModel, Field
import pymysql

from database import get_db_connection
from security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token
)

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])

# Almacén en memoria de códigos de recuperación temporales
# { correo: { "codigo": str, "expira_en": float } }
RECOVERY_CODES = {}
RECOVERY_TTL_SECONDS = 600  # 10 minutos
EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


# ── Modelos de datos (Pydantic) ──────────────────────────────────────────────

class UserRegister(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100, description="Nombre del usuario")
    correo: Optional[str] = Field(None, description="Correo electrónico")
    email: Optional[str] = Field(None, description="Alias para correo electrónico")
    clave: Optional[str] = Field(None, min_length=6, description="Contraseña")
    password: Optional[str] = Field(None, min_length=6, description="Alias para contraseña")
    rol: Optional[str] = Field("usuario", description="Rol del usuario ('usuario', 'administrador', 'desarrollador')")

    def get_email(self) -> str:
        mail = self.correo or self.email
        if not mail or not mail.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo electrónico es obligatorio."
            )
        return mail.strip().lower()

    def get_password(self) -> str:
        pwd = self.clave or self.password
        if not pwd or len(pwd) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La contraseña es obligatoria y debe tener al menos 6 caracteres."
            )
        return pwd


class UserLogin(BaseModel):
    correo: Optional[str] = None
    email: Optional[str] = None
    clave: Optional[str] = None
    password: Optional[str] = None

    def get_email(self) -> str:
        mail = self.correo or self.email
        if not mail or not mail.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo electrónico es obligatorio."
            )
        return mail.strip().lower()

    def get_password(self) -> str:
        pwd = self.clave or self.password
        if not pwd:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La contraseña es obligatoria."
            )
        return pwd


class RecoverRequest(BaseModel):
    correo: Optional[str] = None
    email: Optional[str] = None

    def get_email(self) -> str:
        mail = self.correo or self.email
        if not mail or not mail.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo electrónico es obligatorio."
            )
        return mail.strip().lower()


class RecoverVerifyRequest(BaseModel):
    correo: Optional[str] = None
    email: Optional[str] = None
    codigo: str
    nuevaClave: Optional[str] = None
    clave: Optional[str] = None
    password: Optional[str] = None

    def get_email(self) -> str:
        mail = self.correo or self.email
        if not mail:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo es obligatorio."
            )
        return mail.strip().lower()

    def get_new_password(self) -> str:
        pwd = self.nuevaClave or self.clave or self.password
        if not pwd or len(pwd) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La nueva contraseña debe tener al menos 6 caracteres."
            )
        return pwd


# ── Rutas ────────────────────────────────────────────────────────────────────

@router.post("/register", status_code=status.HTTP_201_CREATED)
@router.post("/registro", status_code=status.HTTP_201_CREATED)
def register_user(data: UserRegister):
    """
    Registra un nuevo usuario en la base de datos MySQL (phpMyAdmin).
    - Valida correo y contraseña.
    - Aplica hash seguro con bcrypt.
    - Guarda en la tabla 'usuarios'.
    """
    clean_nombre = data.nombre.strip()
    clean_correo = data.get_email()
    clean_password = data.get_password()

    if not EMAIL_REGEX.match(clean_correo):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El formato del correo electrónico no es válido."
        )

    # Rol permitido
    rol = data.rol if data.rol in ("usuario", "administrador", "desarrollador") else "usuario"

    try:
        conn = get_db_connection(use_database=True)
    except pymysql.MySQLError as err:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"No se pudo conectar a la base de datos MySQL. Asegúrate de iniciar Laragon o XAMPP. ({err})"
        )

    try:
        with conn.cursor() as cursor:
            # 1. Verificar si el usuario ya existe
            cursor.execute(
                "SELECT id FROM usuarios WHERE correo = %s LIMIT 1;",
                (clean_correo,)
            )
            existente = cursor.fetchone()
            if existente:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="El correo electrónico ya se encuentra registrado."
                )

            # 2. Hashear la contraseña con bcrypt
            clave_hash = hash_password(clean_password)

            # 3. Insertar el nuevo usuario en MySQL
            sql = """
                INSERT INTO usuarios (nombre, correo, clave_hash, rol)
                VALUES (%s, %s, %s, %s);
            """
            cursor.execute(sql, (clean_nombre, clean_correo, clave_hash, rol))
            nuevo_id = cursor.lastrowid

        conn.close()

        print(f"[INFO] Usuario guardado en base de datos MySQL: ID={nuevo_id}, Nombre={clean_nombre}, Correo={clean_correo}")

        return {
            "ok": True,
            "mensaje": "Usuario registrado con éxito en la base de datos.",
            "usuario": {
                "id": nuevo_id,
                "nombre": clean_nombre,
                "correo": clean_correo,
                "rol": rol
            }
        }

    except HTTPException:
        conn.close()
        raise
    except Exception as e:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al registrar usuario en MySQL: {str(e)}"
        )


@router.post("/login")
def login_user(data: UserLogin):
    """
    Inicia sesión validando credenciales contra la base de datos MySQL.
    Retorna un token JWT y los datos de perfil del usuario.
    """
    clean_correo = data.get_email()
    clean_password = data.get_password()

    try:
        conn = get_db_connection(use_database=True)
    except pymysql.MySQLError as err:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"No se pudo conectar a MySQL. Asegúrate de iniciar Laragon o XAMPP. ({err})"
        )

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id, nombre, correo, clave_hash, rol FROM usuarios WHERE correo = %s LIMIT 1;",
                (clean_correo,)
            )
            usuario = cursor.fetchone()

        conn.close()

        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas. Revisa tu correo o contraseña."
            )

        # Validar contraseña con bcrypt
        if not verify_password(clean_password, usuario["clave_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas. Revisa tu correo o contraseña."
            )

        # Generar token JWT
        token_payload = {
            "id": usuario["id"],
            "nombre": usuario["nombre"],
            "correo": usuario["correo"],
            "rol": usuario["rol"]
        }
        token = create_access_token(token_payload)

        return {
            "ok": True,
            "mensaje": "Inicio de sesión exitoso.",
            "token": token,
            "usuario": token_payload
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en el servidor al autenticar: {str(e)}"
        )


@router.get("/me")
def get_current_user(authorization: Optional[str] = Header(None)):
    """
    Retorna los datos del usuario logueado extrayendo el token JWT del encabezado Authorization.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token no proporcionado o formato inválido."
        )

    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado."
        )

    return {
        "ok": True,
        "usuario": {
            "id": payload.get("id"),
            "nombre": payload.get("nombre"),
            "correo": payload.get("correo"),
            "rol": payload.get("rol", "usuario")
        }
    }


@router.post("/recover")
def recover_password(data: RecoverRequest):
    """
    Genera un código de 6 dígitos para recuperación de contraseña.
    """
    correo = data.get_email()

    try:
        conn = get_db_connection(use_database=True)
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, nombre FROM usuarios WHERE correo = %s LIMIT 1;", (correo,))
            user = cursor.fetchone()
        conn.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al consultar base de datos: {str(e)}")

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No existe una cuenta registrada con ese correo electrónico."
        )

    codigo = f"{random.randint(100000, 999999)}"
    RECOVERY_CODES[correo] = {
        "codigo": codigo,
        "expira_en": time.time() + RECOVERY_TTL_SECONDS
    }

    print(f"[INFO] Codigo de recuperacion generado para {correo}: {codigo}")

    return {
        "ok": True,
        "mensaje": f"Código de recuperación generado (válido por 10 min): {codigo}",
        "codigo_demo": codigo,
        "expiraEnMinutos": 10
    }


@router.post("/recover/verify")
def verify_recover_code(data: RecoverVerifyRequest):
    """
    Verifica el código de recuperación y actualiza la contraseña en MySQL.
    """
    correo = data.get_email()
    codigo_input = data.codigo.strip()
    nueva_clave = data.get_new_password()

    registro = RECOVERY_CODES.get(correo)
    if not registro or registro["expira_en"] < time.time():
        RECOVERY_CODES.pop(correo, None)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El código no existe o ha expirado. Solicita uno nuevo."
        )

    if registro["codigo"] != codigo_input:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El código de verificación no coincide."
        )

    nueva_clave_hash = hash_password(nueva_clave)

    try:
        conn = get_db_connection(use_database=True)
        with conn.cursor() as cursor:
            cursor.execute(
                "UPDATE usuarios SET clave_hash = %s WHERE correo = %s;",
                (nueva_clave_hash, correo)
            )
        conn.close()
        RECOVERY_CODES.pop(correo, None)

        return {
            "ok": True,
            "mensaje": "Contraseña restablecida con éxito en la base de datos."
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar la contraseña: {str(e)}"
        )
