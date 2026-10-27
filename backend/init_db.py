"""
SegurIA — Script de Inicialización de Base de Datos
Ejecuta este script para crear la base de datos 'seguria' y las tablas en MySQL (phpMyAdmin).

Uso:
  python init_db.py
"""

import sys

# Configurar salida segura para caracteres en Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from database import init_database, DB_HOST, DB_PORT, DB_NAME, DB_USER

print("=" * 60)
print("[INFO] SegurIA - Inicializador de Base de Datos MySQL (phpMyAdmin)")
print("=" * 60)
print(f"* Host: {DB_HOST}")
print(f"* Puerto: {DB_PORT}")
print(f"* Usuario: {DB_USER}")
print(f"* Base de datos: {DB_NAME}")
print("-" * 60)

ok = init_database()

if ok:
    print("\n[OK] La base de datos y todas las tablas fueron creadas/verificadas con exito.")
    print("     Puedes abrir phpMyAdmin en tu navegador y veras la base de datos 'seguria'.")
    sys.exit(0)
else:
    print("\n[AVISO] No se pudo conectar a MySQL.")
    print("        Asegurate de que Laragon o XAMPP tengan el servicio MySQL iniciado en el puerto 3306.")
    sys.exit(1)
