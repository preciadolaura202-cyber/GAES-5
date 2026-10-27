"""
SegurIA — Módulo de Seguridad y Criptografía
Manejo de contraseñas con Bcrypt y tokens de autenticación JWT.
"""

import os
from datetime import datetime, timedelta, timezone
import bcrypt
import jwt
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET", "seguria_secreto_super_seguro_gaes5_2026")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_DAYS = int(os.getenv("JWT_EXPIRATION_DAYS", 7))


def hash_password(password: str) -> str:
    """
    Genera un hash seguro con salt usando bcrypt.
    """
    salt = bcrypt.gensalt(rounds=10)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica una contraseña en texto plano contra el hash almacenado.
    """
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def create_access_token(data: dict) -> str:
    """
    Genera un token JWT firmado para la sesión del usuario.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRATION_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """
    Decodifica y valida un token JWT. Retorna el payload o None si es inválido/expiró.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except Exception:
        return None
