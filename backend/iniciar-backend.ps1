# SegurIA - Servidor Backend Python (FastAPI) en PowerShell
Write-Host "=========================================================" -ForegroundColor Green
Write-Host "   SegurIA - Servidor Backend en Python (FastAPI)" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Recuerda tener MySQL iniciado en Laragon o XAMPP." -ForegroundColor Yellow
Write-Host "La base de datos es visible en: http://localhost/phpmyadmin" -ForegroundColor Yellow
Write-Host ""

Set-Location $PSScriptRoot

if (-not (Test-Path ".env") -and (Test-Path ".env.example")) {
    Copy-Item ".env.example" ".env"
}

if (-not (Test-Path "venv\Scripts\python.exe")) {
    Write-Host "[INFO] Creando entorno virtual en venv..." -ForegroundColor Cyan
    python -m venv venv
    Write-Host "[INFO] Instalando dependencias necesarias..." -ForegroundColor Cyan
    .\venv\Scripts\pip.exe install -r requirements.txt
}

Write-Host "Iniciando servidor en http://127.0.0.1:8000 ..." -ForegroundColor Green
Write-Host "Documentacion interactiva Swagger en http://127.0.0.1:8000/docs" -ForegroundColor Green
Write-Host ""
Write-Host "Presiona Ctrl+C en cualquier momento para detener el servidor." -ForegroundColor Gray
Write-Host ""

& .\venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
