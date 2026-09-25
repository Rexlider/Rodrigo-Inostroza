@echo off
title Reloj de Eventos - crear instalador
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo No se encontro Node.js. Instalalo desde https://nodejs.org y vuelve a intentar.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Instalando dependencias...
  call npm install
  if errorlevel 1 ( echo Fallo la instalacion. & pause & exit /b 1 )
)

echo Creando el instalador. Esto demora varios minutos...
call npm run dist:win
if errorlevel 1 (
  echo.
  echo No se pudo crear el instalador.
  pause
  exit /b 1
)

echo.
echo Listo. El instalador quedo en la carpeta dist.
start "" "%~dp0dist"
pause
