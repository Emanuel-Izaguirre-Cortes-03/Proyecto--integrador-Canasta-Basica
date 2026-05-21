# Script PowerShell para iniciar el servidor RetailRFM
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Iniciando RetailRFM Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Matar procesos Node.js existentes
Write-Host "[1/3] Deteniendo procesos Node.js..." -ForegroundColor Yellow
try {
    Get-Process node -ErrorAction Stop | Stop-Process -Force
    Write-Host "    Procesos detenidos exitosamente" -ForegroundColor Green
} catch {
    Write-Host "    No hay procesos Node.js activos" -ForegroundColor Gray
}

# Esperar 2 segundos
Write-Host ""
Write-Host "[2/3] Esperando 2 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Iniciar servidor
Write-Host ""
Write-Host "[3/3] Iniciando servidor..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor Gray
Write-Host ""

node server.js
