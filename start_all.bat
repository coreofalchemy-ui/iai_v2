@echo off
cd /d "%~dp0"
echo ===================================================
echo AI Fashion Hub - One-Click Start (Fixed)
echo ===================================================
echo.
echo 1. Killing ALL Node.js processes (Force)...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul
echo.
echo 2. Starting AI Fashion Hub...
echo    - Backend Server (Port 3001) [Limit: 500MB]
echo    - Frontend App (Port 5173)
echo.
echo [IMPORTANT] Please wait for the browser to open...
echo.
call npm run dev:full
pause
