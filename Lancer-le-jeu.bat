@echo off
title Escape Holidays
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js n est pas installe. Telecharge-le sur https://nodejs.org puis relance ce fichier.
  start https://nodejs.org
  pause
  exit /b
)
echo Lancement du jeu sur http://localhost:8080 ... (ferme cette fenetre pour arreter)
start "" http://localhost:8080
node server.js
pause
