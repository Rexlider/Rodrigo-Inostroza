@echo off
title Reloj de Eventos - app de escritorio
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo No se encontro Node.js en este computador.
  echo Instalalo desde https://nodejs.org ^(boton LTS^) y vuelve a ejecutar este archivo.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Instalando por primera vez. Esto demora unos minutos...
  call npm install
  if errorlevel 1 (
    echo.
    echo Fallo la instalacion. Revisa tu conexion a internet.
    pause
    exit /b 1
  )
)

echo Abriendo el Reloj de Eventos...
call npm start
