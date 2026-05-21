@echo off
echo.
echo ========================================
echo   Reiniciando RetailRFM Server
echo ========================================
echo.

echo [1/3] Deteniendo procesos Node.js...
taskkill /F /IM node.exe 2>nul
if errorlevel 1 (
    echo    No hay procesos Node.js activos
) else (
    echo    Procesos detenidos exitosamente
)

echo.
echo [2/3] Esperando 2 segundos...
timeout /t 2 /nobreak >nul

echo.
echo [3/3] Iniciando servidor...
echo.
node server.js
