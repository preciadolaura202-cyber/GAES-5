@echo off
setlocal
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

if not exist ".env" if exist ".env.example" copy .env.example .env >nul

if not exist "venv\Scripts\python.exe" (
    echo [INFO] Creando entorno virtual en backend\venv...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] No se pudo crear el entorno virtual. Asegurate de tener Python en el PATH.
        goto :error
    )
    echo [INFO] Instalando dependencias necesarias...
    venv\Scripts\pip.exe install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] Fallo al instalar librerias.
        goto :error
    )
)

echo Iniciando servidor en http://127.0.0.1:8000 ...
echo Documentacion interactiva Swagger en http://127.0.0.1:8000/docs
echo.
echo Presiona Ctrl+C en cualquier momento para detener el servidor.
echo.

venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
goto :end

:error
echo.
echo Ocurrio un error al intentar iniciar el servidor.
pause
exit /b 1

:end
pause
