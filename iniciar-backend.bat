@echo off
title SegurIA - Servidor Backend Python (FastAPI)
color 0A
echo =========================================================
echo    SegurIA - Servidor Backend en Python (FastAPI)
echo =========================================================
echo.
echo Recuerda tener MySQL iniciado en Laragon o XAMPP.
echo La base de datos es visible en: http://localhost/phpmyadmin
echo.

cd /d "%~dp0backend"

if not exist "venv\Scripts\python.exe" (
    echo [ERROR] No se encontro el entorno virtual en backend\venv
    pause
    exit /b 1
)

echo Iniciando servidor en http://127.0.0.1:8000 ...
echo Documentacion interactiva Swagger en http://127.0.0.1:8000/docs
echo.

venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload

pause
