@echo off
title Escape Holidays
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js n est pas installe. Telecharge-le sur https://nodejs.org ^(bouton LTS^), installe-le, puis relance ce fichier.
  start https://nodejs.org
  pause
  exit /b
)
echo Lancement du jeu... le navigateur va s ouvrir. Garde cette fenetre ouverte pendant que tu joues.
node server.js --open
pause
