"""
SegurIA — Conexión y gestión de Base de Datos MySQL
Compatible con phpMyAdmin (XAMPP / Laragon / Workbench).
"""

import os
import pymysql
import pymysql.cursors
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", 3306))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "seguria")


def get_db_connection(use_database: bool = True):
    """
    Obtiene una conexión con MySQL usando PyMySQL.
    Si use_database=False, se conecta al servidor sin seleccionar la base de datos
    (útil para crearla automáticamente si no existe).
    """
    return pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME if use_database else None,
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True,
        charset="utf8mb4"
    )


def init_database() -> bool:
    """
    Crea la base de datos 'seguria' y las tablas iniciales
    (usuarios, categorias, resenas) si aún no existen en phpMyAdmin/MySQL.
    """
    try:
        # 1. Conexión al servidor MySQL para asegurar que la base de datos exista
        conn = get_db_connection(use_database=False)
        with conn.cursor() as cursor:
            cursor.execute(f"""
                CREATE DATABASE IF NOT EXISTS `{DB_NAME}`
                CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
            """)
        conn.close()

        # 2. Conexión a la base de datos 'seguria' para crear tablas
        conn = get_db_connection(use_database=True)
        with conn.cursor() as cursor:
            # Tabla: usuarios
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS usuarios (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nombre VARCHAR(100) NOT NULL,
                    correo VARCHAR(150) NOT NULL UNIQUE,
                    clave_hash VARCHAR(255) NOT NULL,
                    rol ENUM('usuario', 'administrador', 'desarrollador') DEFAULT 'usuario',
                    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)

            # Tabla: categorias
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS categorias (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nombre VARCHAR(50) NOT NULL UNIQUE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)

            # Tabla: resenas (reportes ciudadanos)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS resenas (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    usuario_id INT NOT NULL,
                    categoria_id INT NOT NULL,
                    titulo VARCHAR(150) NOT NULL,
                    descripcion TEXT NOT NULL,
                    latitud DECIMAL(10, 8) NOT NULL,
                    longitud DECIMAL(11, 8) NOT NULL,
                    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT fk_resenas_usuario FOREIGN KEY (usuario_id) 
                        REFERENCES usuarios(id) ON DELETE CASCADE,
                    CONSTRAINT fk_resenas_categoria FOREIGN KEY (categoria_id) 
                        REFERENCES categorias(id) ON DELETE RESTRICT
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)

            # Insertar categorías iniciales si no existen
            categorias_iniciales = [
                "Robo",
                "Acoso",
                "Hurto",
                "Vandalismo",
                "Otro"
            ]
            for cat in categorias_iniciales:
                cursor.execute("""
                    INSERT INTO categorias (nombre) VALUES (%s)
                    ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);
                """, (cat,))

            # Insertar usuario administrador por defecto si no existe
            cursor.execute("SELECT id FROM usuarios WHERE correo = %s LIMIT 1;", ("admin@seguria.org",))
            admin_existente = cursor.fetchone()
            if not admin_existente:
                from security import hash_password
                clave_admin_hash = hash_password("admin1234")
                cursor.execute("""
                    INSERT INTO usuarios (nombre, correo, clave_hash, rol)
                    VALUES (%s, %s, %s, %s);
                """, ("Administrador General", "admin@seguria.org", clave_admin_hash, "administrador"))
                print("[OK] Usuario administrador registrado por defecto: admin@seguria.org / admin1234 (Rol: administrador)")

        conn.close()
        print(f"[OK] Base de datos '{DB_NAME}' y tablas listas en MySQL (phpMyAdmin).")
        return True

    except pymysql.MySQLError as err:
        print(f"[AVISO] No se pudo conectar a MySQL: {err}")
        print("        Verifica que el servicio MySQL de Laragon o XAMPP este iniciado en el puerto 3306.")
        return False
